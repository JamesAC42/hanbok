'use client';
import styles from '@/styles/components/headernav.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import {IcBaselinePerson} from '@/components/icons/Profile';

function HeaderNav() {
    return (
        <div className={styles.headerNav}>
            <div className={styles.headerNavLeft}>
                <Link href="/pricing" className={styles.headerLinkSpecial}>Pricing</Link>
                <Link href="/blog">Blog</Link>
                <Link href="/lyrics">Lyrics</Link>
                <Link href="/feedback">Feedback</Link>
            </div>
            <div className={styles.headerNavCenter}>
                <Image src="/hanbokicon.png" alt="Hanbok" width={32} height={32} />
                hanbok
            </div>
            <div className={styles.headerNavRight}>
                <Link href={"/profile"}><IcBaselinePerson className={styles.profileIcon} /></Link>
                <div className={styles.getStartedButton} onClick={() => router.push("/analyze")}>
                    Get Started
                </div>
            </div>
        </div>
    )
}

export default HeaderNav;