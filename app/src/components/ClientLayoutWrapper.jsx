'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/analytics';
import Interstitials from '@/components/interstitials/Interstitials';
import TrialBanner from '@/components/TrialBanner';

function ClientLayoutWrapper({ children }) {
  useEffect(() => {
    captureAttribution();
  }, []);

  return (
    <>
      {/* "Plus trial: 3 days left" strip for no-card trial users */}
      <TrialBanner />
      {children} {/* Render the main layout content passed from layout.jsx */}
      {/* Plans/deal popup and announcements, on a shared budget (lib/interstitials.js) */}
      <Interstitials />
    </>
  );
}

export default ClientLayoutWrapper;
