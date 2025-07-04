'use client';
import { useEffect, useState } from 'react';
import SentenceAnalyzer from '@/components/SentenceAnalyzer';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/home/page.module.scss';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {MaterialSymbolsCheckCircleOutlineRounded} from '@/components/icons/CheckCircle';
import {MdiArrowRightBoldCircle} from '@/components/icons/ArrowRight';
import {MaterialSymbolsLightKidStar} from '@/components/icons/StarFilled';
import {SolarMapArrowLeftBoldDuotone} from '@/components/icons/ArrowLeftDuotone';

import ContentPage from '@/components/ContentPage';
import Footer from '@/components/Footer';

function TestimonialCard({quote}) {
  return (
    <div className={styles.testimonial}>
      <div className={styles.testimonialBackground}></div>
      <div className={styles.testimonialContent}>
        <div className={styles.testimonialStars}>
          <MaterialSymbolsLightKidStar />
          <MaterialSymbolsLightKidStar />
          <MaterialSymbolsLightKidStar />
          <MaterialSymbolsLightKidStar />
          <MaterialSymbolsLightKidStar />
        </div>
        <div className={styles.testimonialText}>
          "{quote}"
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { supportedLanguages, t } = useLanguage();
  const router = useRouter();
  const [siteStats, setSiteStats] = useState(null);

  const fetchSiteStats = async () => {
      try {
          const response = await fetch('/api/stats');
          const data = await response.json();
          if (data.success) {
              setSiteStats(data.stats);
          }
      } catch (error) {
          console.error('Error fetching site stats:', error);
      }
  };

  // Add structured data for SEO
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Hanbok",
      "description": "Multi-language learning tool with AI-powered sentence analysis",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "availableLanguage": Object.values(supportedLanguages)
    });
    document.head.appendChild(script);
        
    if(siteStats === null) {
        fetchSiteStats();
    }
    
    return () => {
      document.head.removeChild(script);
    };
  }, [supportedLanguages]);

  return (
    <ContentPage>
      <div className={styles.heroSection}>

        <Image src="/images/background.png" alt="Hero Image" fill priority style={{ objectFit: 'cover' }} />

        <div className={styles.heroContent}>
          <div className={styles.heroContentLeft}>
            <div className={styles.heroHeader}>
              Start reading your favorite Korean content in 90 days.
            </div>
            <div className={styles.heroSubHeader}>
              Hanbok is the AI-powered toolkit that turns any sentence into a grammar and vocab lesson—so you can read real Korean, fast.
            </div>
            <div className={styles.heroMainFeatures}>
              <div className={styles.heroMainFeature}>
                <MaterialSymbolsCheckCircleOutlineRounded />
                Free, Instant Grammar Breakdown
              </div>
              <div className={styles.heroMainFeature}>
                <MaterialSymbolsCheckCircleOutlineRounded />
                Image to Text and Voice-over
              </div>
              <div className={styles.heroMainFeature}>
                <MaterialSymbolsCheckCircleOutlineRounded />
                Cultural Insights
              </div>
              <div className={styles.heroMainFeature}>
                <MaterialSymbolsCheckCircleOutlineRounded />
                Spaced Repetition Vocab
              </div>
              <div className={styles.heroMainFeature}>
                <MaterialSymbolsCheckCircleOutlineRounded />
                Popular Song Lyrics Analysis
              </div>
            </div>
            <div className={styles.heroCTAContainer}>
              <button 
                onClick={() => router.push("/analyze")}
                className={styles.heroCTA}
                data-cta="hero">
                GET STARTED FOR FREE <MdiArrowRightBoldCircle />

              </button>
              <Image src="/images/tryit.png" alt="Try it for free" className={styles.tryIt} width={894} height={773} />
            </div>

          </div>
          <div className={styles.heroContentRight}>
            <Image src="/images/hanbokgirl.png" alt="Hero Image" width={1024} height={1536} />
          </div>

        </div>
      
      </div>

      <div className={styles.testimonials}>
        <div className={styles.testimonialsContent}>
          <TestimonialCard quote="I was amazed when I discovered this site. I have no words, really great site" />
          <TestimonialCard quote="This is such an insanely useful tool." />
          <TestimonialCard quote="I loveeee this site!! The translations are super helpful!" />
          <TestimonialCard quote="This is such an amazing website and by far the  best translation tool I ever came across." />
          <TestimonialCard quote="Oh my god! It's exactly what I need!! I'm a highly visual person and the interface is so pretty. " />
          <TestimonialCard quote="I use Hanbok nearly everyday and honestly I can't thank you enough!!!" />
        </div>

        <div className={styles.whatUsersAreSayingContainer}>
          <div className={styles.whatUsersAreSayingText}>
            <SolarMapArrowLeftBoldDuotone />
            What users are saying!
          </div>
        </div>
      </div>

      <div className={styles.bufferSection}>
      </div>
      {
        siteStats && (
            <div className={`${styles.statsContainer}`}>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>{siteStats.totalSentences.toLocaleString()}</span>
                    <span className={styles.statLabel}>{t('home.stats.sentencesAnalyzed')}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>{siteStats.totalWords.toLocaleString()}</span>
                    <span className={styles.statLabel}>{t('home.stats.wordsLearned')}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>{siteStats.totalUsers.toLocaleString()}</span>
                    <span className={styles.statLabel}>{t('home.stats.activeUsers')}</span>
                </div>
            </div>
        )
    }
      <div className={`${styles.infoSection} ${styles.infoSection1}`}>
        <div className={styles.infoSectionLeft}>
          <h1>What <span className={styles.underline}>is</span> Hanbok?</h1>
          <p className={styles.infoSubHeader}>Hanbok is your AI-powered language lab. Paste any text—song lyric, YouTube subtitle, homework prompt—and get a clear breakdown, native-quality translation, and flash-card-ready vocab in seconds.</p>
          <div className={styles.screenshotContainer}>
            <div className={`${styles.screenshotSingle} ${styles.screenshotSingleMain1}`}>
              <Image src="/images/screenshots/home/main.png" alt="Hanbok main interface" width={1200} height={800} />
            </div>
            <div className={`${styles.screenshotSingle} ${styles.screenshotSingleMain2}`}>
              <Image src="/images/screenshots/home/mainanalysis.png" alt="Hanbok analysis interface" width={1200} height={800} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.infoSection}>
        <div className={styles.infoSectionLeft}>
          <h1>Grammar Breakdowns</h1>
          <p className={styles.infoSubHeader}>See exactly how each word fits: stems, endings, particles, and honorifics. Hover for concise rules and real-life examples so you can reuse the pattern, not just memorize it.</p>
          <div className={styles.screenshotContainer}>
            <div className={styles.screenshotCards}>
              <div className={`${styles.screenshotCard} ${styles.card1}`}>
                <Image src="/images/screenshots/home/grammar1.png" alt="Grammar analysis 1" width={400} height={800} />
              </div>
              <div className={`${styles.screenshotCard} ${styles.card2}`}>
                <Image src="/images/screenshots/home/grammar2.png" alt="Grammar analysis 2" width={400} height={800} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.infoSection}>
        <div className={styles.infoSectionLeft}>
          <h1>Vocab</h1>
          <p className={styles.infoSubHeader}>Capture every new word in a spaced-repetition deck — with audio. One click to review, zero time spent on manual card making.</p>
          <div className={styles.screenshotContainer}>
            <div className={styles.screenshotCards}>
              <div className={`${styles.screenshotCard} ${styles.card1}`}>
                <Image src="/images/screenshots/home/vocab1.png" alt="Vocabulary interface 1" width={400} height={800} />
              </div>
              <div className={`${styles.screenshotCard} ${styles.card2}`}>
                <Image src="/images/screenshots/home/vocab2.png" alt="Vocabulary interface 2" width={400} height={800} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.infoSection}>
        <div className={styles.infoSectionLeft}>
          <h1>Image to Text</h1>
          <p className={styles.infoSubHeader}>Snap a photo of a street sign or screenshot a tweet. Hanbok OCRs the text, cleans it up, and feeds it straight into the analyzer—perfect for on-the-go study.</p>
          <div className={styles.screenshotContainer}>
            <div className={styles.screenshotSingle}>
              <Image src="/images/screenshots/home/imageextraction.png" alt="Image to text extraction" width={800} height={600} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.infoSection}>
        <div className={styles.infoSectionLeft}>
          <h1>Personal Tutor</h1>
          <p className={styles.infoSubHeader}>Chat with an AI teacher that knows your level. Ask follow-up questions, request extra drills, or get instant feedback on your own sentences—all within the same tab.</p>
          <div className={styles.screenshotContainer}>
            <div className={styles.screenshotSingle}>
              <Image src="/images/screenshots/home/chatwindow.png" alt="AI tutor chat interface" width={800} height={600} />
            </div>
          </div>
        </div>
      </div>
      <div className={`${styles.infoSection} ${styles.infoSectionLast}`}>
        <div className={styles.infoSectionLeft}>
          <h1>Lyric Analysis</h1>
          <p className={styles.infoSubHeader}>Explore our growing collection of K-Pop, J-pop, and Anime lyrics analysis, with line-by-line breakdowns, flashcard-ready vocab, and cultural insights.</p>
          <div className={styles.screenshotContainer}>
            <div className={`${styles.screenshotSingle}`}>
              <Image src="/images/screenshots/home/lyrics.png" alt="Hanbok analysis interface" width={1200} height={800} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.getStartedSection}>
        <Image src="/images/backgrounddark.png" alt="Hero Image" fill priority style={{ objectFit: 'cover' }} />
          <div className={styles.getStartedContent}>
            <h1>Accelerate your learning, now!</h1>
            <div className={styles.getStartedButtonContainer}>
              <button 
                  onClick={() => router.push("/analyze")}
                  className={styles.heroCTA}
                  data-cta="footer">
                  GET STARTED FOR FREE <MdiArrowRightBoldCircle />

                </button>          
            </div>
          </div>
      </div>
      <Footer />
    </ContentPage>
  );
}
