'use client';
import { useEffect } from 'react';
import SentenceAnalyzer from '@/components/SentenceAnalyzer';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { supportedLanguages } = useLanguage();
  
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
    <Dashboard>
      <SentenceAnalyzer />
    </Dashboard>
  );
}
