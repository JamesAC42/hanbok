'use client';
import styles from '@/styles/components/headernav.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import {IcBaselinePerson} from '@/components/icons/Profile';
import { useRouter } from 'next/navigation';    

function HeaderNav() {
    const router = useRouter();
    return (
        <div className={styles.headerNav}>
            <div className={styles.headerNavLeft}>
                <Link href="/pricing" className={styles.headerLinkSpecial}>Pricing</Link>
                <Link href="/lessons">Lessons</Link>
                <Link href="/lyrics">Lyrics</Link>
                <Link href="/feedback">Feedback</Link>
            </div>
            <div className={styles.headerNavCenter}>
                <Link href="/">hanbok</Link>
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