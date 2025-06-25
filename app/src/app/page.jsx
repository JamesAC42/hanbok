'use client';
import { useEffect } from 'react';
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
  const { supportedLanguages } = useLanguage();
  const router = useRouter();
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
              Hanbok is the comprehensive language learning system with the tools you need to master grammar and vocab for the real world.
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
              <div 
                onClick={() => router.push("/analyze")}
                className={styles.heroCTA}>
                GET STARTED FOR FREE <MdiArrowRightBoldCircle />

              </div>
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
      <div className={`${styles.infoSection} ${styles.infoSection1}`}>
        <div className={styles.infoSectionLeft}>
          <h1>What <span className={styles.underline}>is</span> Hanbok?</h1>
          <p className={styles.infoSubHeader}>Hanbok is a multi-language learning tool that helps you learn languages with AI-powered sentence analysis, vocabulary tools, and cultural insights.</p>
        </div>
      </div>
      <div className={styles.infoSection}>
        <div className={styles.infoSectionLeft}>
          <h1>Grammar Breakdowns</h1>
          <p className={styles.infoSubHeader}>Hanbok is a multi-language learning tool that helps you learn languages with AI-powered sentence analysis, vocabulary tools, and cultural insights.</p>
        </div>
      </div>
      <div className={styles.infoSection}>
        <div className={styles.infoSectionLeft}>
          <h1>Vocab</h1>
          <p className={styles.infoSubHeader}>Hanbok is a multi-language learning tool that helps you learn languages with AI-powered sentence analysis, vocabulary tools, and cultural insights.</p>
        </div>
      </div>
      <div className={styles.infoSection}>
        <div className={styles.infoSectionLeft}>
          <h1>Image to Text</h1>
          <p className={styles.infoSubHeader}>Hanbok is a multi-language learning tool that helps you learn languages with AI-powered sentence analysis, vocabulary tools, and cultural insights.</p>
        </div>
      </div>
      <div className={styles.infoSection}>
        <div className={styles.infoSectionLeft}>
          <h1>Personal Tutor</h1>
          <p className={styles.infoSubHeader}>Hanbok is a multi-language learning tool that helps you learn languages with AI-powered sentence analysis, vocabulary tools, and cultural insights.</p>
        </div>
      </div>
      <div className={`${styles.infoSection} ${styles.infoSectionLast}`}>
        <div className={styles.infoSectionLeft}>
          <h1>Lyric Analysis</h1>
          <p className={styles.infoSubHeader}>Hanbok is a multi-language learning tool that helps you learn languages with AI-powered sentence analysis, vocabulary tools, and cultural insights.</p>
        </div>
      </div>

      <div className={styles.getStartedSection}>
        <Image src="/images/backgrounddark.png" alt="Hero Image" fill priority style={{ objectFit: 'cover' }} />
          <div className={styles.getStartedContent}>
            <h1>Accelerate your learning, now!</h1>

            <div 
                onClick={() => router.push("/analyze")}
                className={styles.heroCTA}>
                GET STARTED FOR FREE <MdiArrowRightBoldCircle />

              </div>          
          </div>
      </div>
      <Footer />
    </ContentPage>
  );
}
