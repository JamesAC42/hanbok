'use client';
import Script from 'next/script';
import { useAuth } from '@/contexts/AuthContext';

export default function RedditPixel() {
  const { user } = useAuth();

  return (
    <Script id="reddit-pixel">
      {`!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
      rdt('init', 'a2_glnsm3gon198'${user?.email ? `, {
        email: '${user.email}'
      }` : ''});
      rdt('track', 'PageVisit');`}
    </Script>
  );
} 