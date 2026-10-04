#!/usr/bin/env node
// Mirrors posts from the site's /feedback forum into GitHub issues so they can be
// triaged (and bugs fixed) from GitHub. Runs from .github/workflows/feedback-sync.yml.
//
// Each top-level post becomes one issue labelled `feedback`; its replies are written
// into the issue body and new replies are also added as comments. Hidden markers in
// the body record which feedback id and reply ids an issue already covers, so runs
// are idempotent. Needs Node 18+ (global fetch) and no npm dependencies.
//
// Env:
//   GITHUB_TOKEN, GITHUB_REPOSITORY  required unless DRY_RUN=1
//   FEEDBACK_URL     default https://hanbokstudy.com/api/feedback
//   MAX_NEW          most issues to create per run (default 30)
//   BACKLOG_BEFORE   posts older than this date get `feedback:backlog` instead of `feedback:new`
//   DRY_RUN=1        print what would change, touch nothing on GitHub

const FEEDBACK_URL = process.env.FEEDBACK_URL || 'https://hanbokstudy.com/api/feedback';
const SITE_FEEDBACK_PAGE = 'https://hanbokstudy.com/feedback';
const REPO = process.env.GITHUB_REPOSITORY;
const TOKEN = process.env.GITHUB_TOKEN;
const DRY_RUN = process.env.DRY_RUN === '1';
const MAX_NEW = parseInt(process.env.MAX_NEW || '30', 10);
const BACKLOG_BEFORE = new Date(process.env.BACKLOG_BEFORE || '2026-10-04T00:00:00Z');

const LABELS = {
    feedback: { color: '5319e7', description: 'Mirrored from the hanbokstudy.com feedback page' },
    'feedback:new': { color: 'fbca04', description: 'New feedback, not triaged yet' },
    'feedback:backlog': { color: 'c5def5', description: 'Feedback posted before the sync started, not triaged yet' },
};

const ID_MARKER = /<!-- hanbok-feedback-id: (\d+) -->/;
const REPLIES_MARKER = /<!-- hanbok-feedback-reply-ids: ([\d,]*) -->/;
const DELETED_MARKER = '<!-- hanbok-feedback-deleted -->';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchAllFeedback() {
    const all = [];
    for (let page = 1; page <= 500; page++) {
        const res = await fetch(`${FEEDBACK_URL}?page=${page}&limit=50`, {
            headers: { 'User-Agent': 'hanbok-feedback-sync' },
        });
        if (!res.ok) throw new Error(`GET feedback page ${page}: HTTP ${res.status}`);
        const body = await res.json();
        if (!body.success) throw new Error(`GET feedback page ${page}: ${body.error}`);
        all.push(...body.feedback);
        if (body.feedback.length === 0 || page >= body.totalPages) break;
    }
    return all;
}

function flattenReplies(item) {
    const out = [];
    const walk = (node, depth) => {
        for (const reply of node.replies || []) {
            out.push({ ...reply, depth });
            walk(reply, depth + 1);
        }
    };
    walk(item, 0);
    return out;
}

// Feedback text is user-written: keep it from pinging GitHub users or breaking the markdown.
function quote(text) {
    return String(text)
        .replace(/@/g, '@​')
        .replace(/<!--/g, '&lt;!--')
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
}

// Some display names are email addresses; keep those out of public issues.
const name = (n) => String(n || 'someone').replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email hidden]');

const day = (d) => new Date(d).toISOString().slice(0, 10);

function renderReply(reply, rootUserId) {
    const who = reply.userId === rootUserId ? `${name(reply.userName)} (original poster)` : name(reply.userName);
    const indent = reply.depth > 0 ? ` (reply to a reply)` : '';
    return `**${who}** · ${day(reply.dateCreated)}${indent}\n\n${quote(reply.text)}`;
}

function renderBody(item, replies) {
    const deleted = item.isDeleted === true;
    const lines = [
        `<!-- hanbok-feedback-id: ${item.feedbackId} -->`,
        `<!-- hanbok-feedback-reply-ids: ${replies.map((r) => r.feedbackId).join(',')} -->`,
    ];
    if (deleted) lines.push(DELETED_MARKER);
    lines.push(
        `Posted on the [feedback page](${SITE_FEEDBACK_PAGE}) by **${name(item.userName)}** on ${day(item.dateCreated)} (feedback #${item.feedbackId}).`,
        '',
        deleted ? '_The author deleted this post._' : quote(item.text),
    );
    if (replies.length) {
        lines.push('', `### Replies (${replies.length})`, '');
        lines.push(replies.map((r) => renderReply(r, item.userId)).join('\n\n---\n\n'));
    }
    lines.push('', '<sub>Synced automatically by the feedback-sync workflow. Edits here are overwritten on the next sync; comment instead.</sub>');
    return lines.join('\n');
}

function renderTitle(item) {
    if (item.isDeleted) return `Feedback #${item.feedbackId}: [deleted]`;
    const oneLine = String(item.text).replace(/\s+/g, ' ').trim();
    const short = oneLine.length > 70 ? `${oneLine.slice(0, 67)}...` : oneLine;
    return `Feedback #${item.feedbackId}: ${short}`;
}

async function gh(method, path, body) {
    for (let attempt = 0; ; attempt++) {
        const res = await fetch(`https://api.github.com${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'hanbok-feedback-sync',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if ((res.status === 403 || res.status === 429) && attempt < 3) {
            const wait = parseInt(res.headers.get('retry-after') || '60', 10);
            console.log(`Rate limited on ${method} ${path}, waiting ${wait}s`);
            await sleep(wait * 1000);
            continue;
        }
        if (!res.ok) {
            const err = new Error(`${method} ${path}: HTTP ${res.status} ${await res.text()}`);
            err.status = res.status;
            throw err;
        }
        return res.status === 204 ? null : res.json();
    }
}

async function ensureLabels() {
    for (const [name, spec] of Object.entries(LABELS)) {
        try {
            await gh('POST', `/repos/${REPO}/labels`, { name, ...spec });
        } catch (e) {
            if (e.status !== 422) throw e; // 422: label already exists
        }
    }
}

async function existingIssues() {
    const byFeedbackId = new Map();
    for (let page = 1; ; page++) {
        const issues = await gh('GET', `/repos/${REPO}/issues?labels=feedback&state=all&per_page=100&page=${page}`);
        for (const issue of issues) {
            const m = issue.body && issue.body.match(ID_MARKER);
            if (!m) continue;
            const r = issue.body.match(REPLIES_MARKER);
            byFeedbackId.set(Number(m[1]), {
                number: issue.number,
                state: issue.state,
                replyIds: new Set(r && r[1] ? r[1].split(',').map(Number) : []),
                deleted: issue.body.includes(DELETED_MARKER),
            });
        }
        if (issues.length < 100) break;
    }
    return byFeedbackId;
}

async function main() {
    if (!DRY_RUN && (!TOKEN || !REPO)) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required');

    const feedback = await fetchAllFeedback();
    feedback.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated)); // oldest first
    console.log(`Fetched ${feedback.length} top-level feedback posts`);

    if (DRY_RUN && !TOKEN) {
        for (const item of feedback) {
            const replies = flattenReplies(item);
            console.log(`\n=== #${item.feedbackId} ${day(item.dateCreated)} ${name(item.userName)}${item.isDeleted ? ' [deleted]' : ''} (${replies.length} replies)`);
            console.log(item.text);
            for (const r of replies) console.log(`  -> ${name(r.userName)} ${day(r.dateCreated)}: ${String(r.text).replace(/\n/g, ' ')}`);
        }
        return;
    }

    if (!DRY_RUN) await ensureLabels();
    const existing = await existingIssues();
    let created = 0;
    let updated = 0;
    let deferred = 0;

    for (const item of feedback) {
        const replies = flattenReplies(item);
        const known = existing.get(item.feedbackId);

        if (!known) {
            // Nothing worth tracking in a post deleted before we ever saw it.
            if (item.isDeleted && replies.length === 0) continue;
            if (created >= MAX_NEW) {
                deferred++;
                continue;
            }
            const triage = new Date(item.dateCreated) < BACKLOG_BEFORE ? 'feedback:backlog' : 'feedback:new';
            console.log(`Create issue for #${item.feedbackId} [${triage}]`);
            if (!DRY_RUN) {
                await gh('POST', `/repos/${REPO}/issues`, {
                    title: renderTitle(item),
                    body: renderBody(item, replies),
                    labels: ['feedback', triage],
                });
                await sleep(1500); // stay under GitHub's content-creation rate limit
            }
            created++;
            continue;
        }

        const newReplies = replies.filter((r) => !known.replyIds.has(r.feedbackId));
        const newlyDeleted = item.isDeleted && !known.deleted;
        if (newReplies.length === 0 && !newlyDeleted) continue;

        console.log(`Update issue #${known.number} for feedback #${item.feedbackId}: ${newReplies.length} new replies${newlyDeleted ? ', post deleted' : ''}`);
        updated++;
        if (DRY_RUN) continue;

        const patch = { title: renderTitle(item), body: renderBody(item, replies) };
        // The author withdrew it: stop tracking it, but leave the issue's replies and comments.
        if (newlyDeleted) Object.assign(patch, { state: 'closed', state_reason: 'not_planned' });
        await gh('PATCH', `/repos/${REPO}/issues/${known.number}`, patch);

        if (newReplies.length) {
            const comment = [
                `New ${newReplies.length === 1 ? 'reply' : 'replies'} on the feedback page:`,
                '',
                newReplies.map((r) => renderReply(r, item.userId)).join('\n\n---\n\n'),
            ].join('\n');
            await gh('POST', `/repos/${REPO}/issues/${known.number}/comments`, { body: comment });
            // A reply on a closed thread may be a "still broken" report: put it back in the queue.
            if (known.state === 'closed' && !item.isDeleted) {
                await gh('PATCH', `/repos/${REPO}/issues/${known.number}`, { state: 'open' });
                await gh('POST', `/repos/${REPO}/issues/${known.number}/labels`, { labels: ['feedback:new'] });
            }
            await sleep(1500);
        }
    }

    console.log(`Done: ${created} created, ${updated} updated${deferred ? `, ${deferred} left for later runs` : ''}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
