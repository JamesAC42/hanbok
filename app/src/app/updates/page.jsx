import Link from 'next/link';
import UpdatesShell from '@/components/updates/UpdatesShell';
import Mascot from '@/components/Mascot';
import { updates } from '@/content/updates';
import styles from '@/styles/pages/updates.module.scss';

export const metadata = {
    title: "What's new in Hanbok",
    description: 'Product updates from Hanbok: new features, design changes and fixes.',
    alternates: { canonical: '/updates' },
};

export default function UpdatesIndex() {
    return (
        <UpdatesShell>
            <div className={styles.column}>
                <header className={styles.indexHeader}>
                    <Mascot pose="speak" size={96} motion="bob" />
                    <div>
                        <p className={styles.label}>Updates</p>
                        <h1 className={styles.title}>What&apos;s new in Hanbok</h1>
                        <p className={styles.dek}>New features, design changes and fixes, newest first.</p>
                    </div>
                </header>
                <ul className={styles.postList}>
                    {updates.map(post => (
                        <li key={post.slug}>
                            <Link href={`/updates/${post.slug}`} className={styles.postCard}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={post.image} alt="" className={styles.postThumb} loading="lazy" />
                                <span className={styles.postText}>
                                    <span className={styles.postDate}>{post.dateLabel}</span>
                                    <span className={styles.postTitle}>{post.title}</span>
                                    <span className={styles.postDek}>{post.description}</span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </UpdatesShell>
    );
}
