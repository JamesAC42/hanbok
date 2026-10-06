export const metadata = {
    // Song pages under /lyrics still get the site-wide "| Hanbok" suffix.
    title: { default: 'Learn Korean & Japanese with Song Lyrics', template: '%s | Hanbok' },
    description: 'K-pop, J-pop and anime songs with line-by-line English translations. Tap any line to see every word and grammar point explained.',
    alternates: { canonical: '/lyrics' },
};

export default function Layout({ children }) {
    return children;
}
