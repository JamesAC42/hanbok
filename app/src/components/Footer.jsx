import styles from '@/styles/components/footer.module.scss';
import Link from 'next/link';
import Mascot from '@/components/Mascot';
import { IcTwotoneDiscord } from '@/components/icons/DiscordIcon';

const DISCORD = 'https://discord.gg/EQVvphzctc';

const COLUMNS = [
    {
        title: 'Learn',
        links: [
            { href: '/analyze', label: 'Break down a sentence' },
            { href: '/lyrics', label: 'Song lyrics' },
            { href: '/learn', label: 'Grammar guides' },
            { href: '/hangeul', label: 'Learn Hangeul' },
            { href: '/extension', label: 'Chrome extension' },
        ],
    },
    {
        title: 'Hanbok',
        links: [
            { href: '/about', label: 'About' },
            { href: '/updates', label: "What's new" },
            { href: '/pricing', label: 'Pricing' },
            { href: '/feedback', label: 'Send feedback' },
            { href: 'mailto:admin@hanbokstudy.com', label: 'Email us', external: true },
        ],
    },
    {
        title: 'Follow',
        links: [
            { href: 'https://www.tiktok.com/@hanbokstudy', label: 'TikTok', external: true },
            { href: 'https://www.instagram.com/hanbokstudy', label: 'Instagram', external: true },
            { href: 'https://www.youtube.com/@HanbokStudy', label: 'YouTube', external: true },
            { href: 'https://x.com/fifltriggi', label: 'X (Twitter)', external: true },
            { href: 'https://github.com/JamesAC42/hanbok', label: 'GitHub', external: true },
        ],
    },
    {
        title: 'Legal',
        links: [
            { href: '/privacy-policy.html', label: 'Privacy Policy' },
            { href: '/terms-of-service.html', label: 'Terms of Service' },
        ],
    },
];

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.discord}>
                    <Mascot pose="speak" size={84} label="" className={styles.discordMascot} />
                    <div className={styles.discordText}>
                        <strong>Study with other learners</strong>
                        <span>Ask questions, share what you are reading and tell us what to build next.</span>
                    </div>
                    <a href={DISCORD} target="_blank" rel="noopener noreferrer" className={styles.discordButton}>
                        <IcTwotoneDiscord /> Join the Discord
                    </a>
                </div>

                <div className={styles.grid}>
                    <div className={styles.brand}>
                        <Link href="/" className={styles.wordmark}>
                            <Mascot pose="head" size={34} label="" />
                            <span>hanbok</span>
                        </Link>
                        <p>Understand Korean, Japanese and Chinese sentences word by word, then keep what you learn.</p>
                    </div>
                    {COLUMNS.map((col) => (
                        <nav key={col.title} className={styles.column} aria-label={col.title}>
                            <h2>{col.title}</h2>
                            <ul>
                                {col.links.map((l) => (
                                    <li key={l.href}>
                                        {l.external
                                            ? <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
                                            : <Link href={l.href}>{l.label}</Link>}
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>

                <div className={styles.bottom}>
                    <span>© {new Date().getFullYear()} Hanbok Study</span>
                    <span lang="ko">한국어 · 日本語 · 中文</span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
