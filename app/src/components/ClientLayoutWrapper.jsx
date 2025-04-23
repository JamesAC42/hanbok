'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SubscriptionPromptPopup from '@/components/SubscriptionPromptPopup';

function ClientLayoutWrapper({ children }) {
  const { user, loading } = useAuth();
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);

  useEffect(() => {
    // Only run on the client
    if (typeof window !== 'undefined' && !loading) {
      // Show prompt only for logged-out users or free-tier users
      if (!user || user.tier === 0) {
        const promptKey = 'lastSubscriptionPromptTimestamp';
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const lastPromptTime = localStorage.getItem(promptKey);
        const now = Date.now();

        if (!lastPromptTime) {
          // If no timestamp exists, set it and maybe show immediately? Or wait 24h?
          // Let's set it and wait 24h from first visit.
          localStorage.setItem(promptKey, now.toString());
        } else {
          // If timestamp exists, check if 24 hours have passed
          if (now - parseInt(lastPromptTime, 10) > twentyFourHours) {
            setShowSubscriptionPrompt(true);
            // Update timestamp after showing
            localStorage.setItem(promptKey, now.toString());
          }
        }
      }
    }
  }, [user, loading]); // Rerun effect when user or loading state changes

  const handleCloseSubscriptionPrompt = () => {
    setShowSubscriptionPrompt(false);
    // Optionally, update the timestamp immediately on close to reset the 24h timer
    // localStorage.setItem('lastSubscriptionPromptTimestamp', Date.now().toString());
  };

  return (
    <>
      {children} {/* Render the main layout content passed from layout.jsx */}
      {showSubscriptionPrompt && <SubscriptionPromptPopup onClose={handleCloseSubscriptionPrompt} />}
    </>
  );
}

export default ClientLayoutWrapper; 