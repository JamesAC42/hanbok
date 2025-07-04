import styles from '@/styles/components/footer.module.scss';
import Link from 'next/link';

import { IcTwotoneDiscord } from '@/components/icons/DiscordIcon';

function Footer() {
    return (
        <>
        <div className={styles.joinDiscord}>
          <div className={styles.joinDiscordBubble}>
            Join the Discord!
  
            <Link href="https://discord.gg/EQVvphzctc" target="_blank">
              <IcTwotoneDiscord /> Join Now
            </Link>
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerLinks}>
              <div className={styles.footerLinkColumn}>
                <div className={styles.footerLinkColumnHeader}>
                  Explore
                </div>
                <div className={styles.footerLinkColumnLinks}>
                  <Link href="/about">About</Link>
                  <Link href="/analyze">Analyze</Link>
                  <Link href="/cards">Cards</Link>
                  <Link href="/lyrics">Lyrics</Link>
                  <Link href="/pricing">Pricing</Link>
                </div>
              </div>
              <div className={styles.footerLinkColumn}>
                <div className={styles.footerLinkColumnHeader}>
                  Socials
                </div>
                <div className={styles.footerLinkColumnLinks}>
                  <Link href="https://x.com/fifltriggi" target="_blank">Twitter</Link>
                  <Link href="https://discord.gg/EQVvphzctc" target="_blank">Discord</Link>
                  <Link href="https://github.com/JamesAC42/hanbok" target="_blank">GitHub</Link>
                  <Link href="https://www.instagram.com/hanbokstudy" target="_blank">Instagram</Link>
                  <Link href="https://www.youtube.com/@HanbokStudy" target="_blank">Youtube</Link>
                  <Link href="https://www.tiktok.com/@hanbokstudy" target="_blank">TikTok</Link>
                  <Link href="mailto:jamescrovo450@gmail.com" target="_blank">Email</Link>
                </div>
              </div>
              <div className={styles.footerLinkColumn}>
                <div className={styles.footerLinkColumnHeader}>
                  Resources
                </div>
                <div className={styles.footerLinkColumnLinks}>
                  <Link href="/privacy-policy.html">Privacy Policy</Link>
                  <Link href="/terms-of-service.html">Terms of Service</Link>
                </div>
              </div>
            </div>
            <div className={styles.footerCopyright}>
              © 2025 Hanbok Study. All rights reserved.
            </div>
          </div>
        </div>
        </>
    )
}

export default Footer;