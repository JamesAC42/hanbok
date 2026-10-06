import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/components/markdown.module.scss';

// Inline formatting: `code`, **bold**, *italic*. Code spans are pulled out first
// so their contents are not touched by the other rules.
const renderInline = (text) => {
  const codes = [];
  let html = text.replace(/`([^`\n]+?)`/g, (match, code) => {
    codes.push(code);
    return `\u0000C${codes.length - 1}\u0000`;
  });

  html = html.replace(/\*\*(.+?)\*\*/g, `<strong class="${styles.bold}">$1</strong>`);
  html = html.replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, `$1<em class="${styles.italic}">$2</em>`);
  html = html.replace(/\u0000C(\d+)\u0000/g, (match, i) => `<code class="${styles.code}">${codes[+i]}</code>`);

  return html;
};

// Tutor replies are model output, so escape all markup before any of our own
// HTML is added. Only &, < and > matter: nothing is placed inside attributes
// except through encodeURIComponent.
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescapeHtml = (text) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const splitRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
const isTableDivider = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

const MarkdownRenderer = ({ content }) => {
  const router = useRouter();

  if (!content) return null;

  // Handle example click navigation
  const handleExampleClick = (exampleText) => {
    // Clean up the example text and extract Korean sentence
    const cleanText = unescapeHtml(exampleText)
      .replace(/<[^>]*>/g, '') // Remove any HTML tags
      .replace(/\n\s*\n/g, '\n') // Clean up extra newlines
      .trim();

    // Store in localStorage for the analyze page
    localStorage.setItem('pendingAnalysis', cleanText);

    // Navigate to analyze page
    router.push('/analyze');
  };

  // Small block-level markdown renderer: headings, lists, tables, code blocks,
  // quotes, rules, paragraphs and <example> tags.
  const renderMarkdown = (text) => {
    const blocks = [];
    let exampleId = 0;

    // Pull out example tags and fenced code first; they become placeholder lines.
    let source = escapeHtml(text).replace(/&lt;example&gt;(.*?)&lt;\/example&gt;/gs, (match, example) => {
      const currentId = `example-${exampleId++}`;
      const body = example.trim();
      blocks.push(`<div class="${styles.example}" role="button" tabindex="0" data-example-id="${currentId}" data-example-text="${encodeURIComponent(body)}">
        <span class="${styles.exampleLabel}">Example</span>
        <div class="${styles.exampleContent}">${renderInline(body).replace(/\n/g, '<br/>')}</div>
        <span class="${styles.clickHint}">Analyze this sentence →</span>
      </div>`);
      return `\n\u0000B${blocks.length - 1}\u0000\n`;
    });

    source = source.replace(/```[^\n]*\n([\s\S]*?)```/g, (match, code) => {
      blocks.push(`<pre class="${styles.pre}"><code>${code.replace(/\n$/, '')}</code></pre>`);
      return `\n\u0000B${blocks.length - 1}\u0000\n`;
    });

    const lines = source.split('\n');
    const out = [];
    let paragraph = [];
    let list = null; // { type: 'ul' | 'ol', items: [] }

    const flushParagraph = () => {
      if (paragraph.length) {
        out.push(`<p>${paragraph.map(renderInline).join('<br/>')}</p>`);
        paragraph = [];
      }
    };
    const flushList = () => {
      if (list) {
        const cls = list.type === 'ol' ? styles.orderedList : styles.list;
        out.push(`<${list.type} class="${cls}">${list.items.map((item) => `<li class="${styles.listItem}">${renderInline(item)}</li>`).join('')}</${list.type}>`);
        list = null;
      }
    };
    const flush = () => { flushParagraph(); flushList(); };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      let match;

      if (!trimmed) { flush(); continue; }

      if ((match = trimmed.match(/^\u0000B(\d+)\u0000$/))) {
        flush();
        out.push(blocks[+match[1]]);
        continue;
      }

      if ((match = trimmed.match(/^(#{1,6})\s+(.*)$/))) {
        flush();
        const level = Math.min(match[1].length, 3);
        out.push(`<h${level} class="${styles[`h${level}`]}">${renderInline(match[2])}</h${level}>`);
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flush();
        out.push(`<hr class="${styles.rule}"/>`);
        continue;
      }

      // Table: a row of cells followed by a |---|---| divider.
      if (trimmed.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
        flush();
        const head = splitRow(trimmed);
        const rows = [];
        i += 2;
        while (i < lines.length && lines[i].trim().includes('|')) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        i--;
        out.push(`<div class="${styles.tableWrap}"><table class="${styles.table}"><thead><tr>${head.map((c) => `<th>${renderInline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }

      if ((match = line.match(/^\s*[-*•]\s+(.*)$/))) {
        flushParagraph();
        if (list?.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
        list.items.push(match[1]);
        continue;
      }

      if ((match = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
        flushParagraph();
        if (list?.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
        list.items.push(match[1]);
        continue;
      }

      if ((match = trimmed.match(/^&gt;\s?(.*)$/))) {
        flush();
        out.push(`<blockquote class="${styles.quote}">${renderInline(match[1])}</blockquote>`);
        continue;
      }

      // A plain line right after a list item continues that item.
      if (list && /^\s{2,}/.test(line)) {
        list.items[list.items.length - 1] += `<br/>${trimmed}`;
        continue;
      }

      flushList();
      paragraph.push(trimmed);
    }
    flush();

    return out.join('');
  };

  const openExample = (target) => {
    const exampleElement = target.closest(`[data-example-id]`);
    if (exampleElement) {
      const exampleText = decodeURIComponent(exampleElement.dataset.exampleText);
      handleExampleClick(exampleText);
    }
  };

  return (
    <div
      className={styles.markdown}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      onClick={(e) => {
        // Check if clicked element is an example block
        openExample(e.target);
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-example-id]')) {
          e.preventDefault();
          openExample(e.target);
        }
      }}
    />
  );
};

export default MarkdownRenderer;
