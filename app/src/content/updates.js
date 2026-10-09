// Product update posts, newest first. Each post is a page under app/updates.
export const updates = [
    {
        slug: 'speak',
        title: 'Talk it out: Speak with Horang and Sora',
        description: 'Practice Korean out loud in role-play scenes with two AI characters, and get help in English whenever you get stuck.',
        published: '2026-10-09',
        dateLabel: 'October 2026',
        image: '/images/updates/speak-picker.webp',
    },
    {
        slug: 'new-hanbok',
        title: 'Hanbok has a new look',
        description: 'Same Hanbok, same account, and everything you saved is still here. Here is what changed in the redesign and where to find things.',
        published: '2026-10-07',
        dateLabel: 'October 2026',
        image: '/images/updates/new-home.webp',
    },
];

// Smaller things shipped recently, newest first, grouped by the day they shipped.
// One plain sentence each; `href` is optional.
export const changelog = [
    {
        date: '2026-10-09',
        items: [
            { text: 'Speak: talk out loud with Horang and Sora in role-play scenes.', href: '/speak' },
        ],
    },
    {
        date: '2026-10-08',
        items: [
            { text: 'Clear your history (hide single sentences or everything), random links for new sentences, and folders for saved sentences and paragraphs.' },
            { text: '"What does it mean" pages for popular Korean phrases like 대박 and 아이고.' },
        ],
    },
    {
        date: '2026-10-07',
        items: [
            { text: 'Lyric pages became study notes with key words and grammar for each song.' },
            { text: 'A free Korean sentence analyzer page.', href: '/korean-sentence-analyzer' },
            { text: 'Share button on every sentence breakdown, with a preview card.' },
            { text: 'Student pricing (50% off with a school email) and yearly plans shown first.' },
            { text: 'Darker, easier-to-read word colors in breakdowns.' },
            { text: 'Saved grammar now has its own path, lessons and quizzes inside Review.' },
            { text: 'The Reader handles longer texts: up to 1,000 characters free, 5,000 on Basic and 20,000 on Plus.' },
            { text: 'You can remove saved words, and their flashcards go with them.' },
        ],
    },
    {
        date: '2026-10-06',
        items: [
            { text: "Hanbok's new look, with Learn guides, the Review path and a cleaner Library.", href: '/updates/new-hanbok' },
        ],
    },
];

// "October 9, 2026" from "2026-10-09", without time zone drift.
export function formatChangelogDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
}
