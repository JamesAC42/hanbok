'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import LimitReachedPopup from '@/components/LimitReachedPopup';
import LoginRequiredPopup from '@/components/LoginRequiredPopup';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import PromoPopup from '@/components/PromoPopup';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const PopupContext = createContext();

// Current announcement. A new id shows it once more to everyone it targets.
// The redesign note only makes sense to people who used the old design, so it
// goes to signed-in accounts created before the new look went out.
const CURRENT_ANNOUNCEMENT = {
    id: '2026-10-new-look',
    accountsCreatedBefore: '2026-10-08T00:00:00Z',
};

export function PopupProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const pathname = usePathname();
    const [popupState, setPopupState] = useState({
        show: false,
        type: null,
        variant: null, // 'limit', 'login', or 'announcement'
        announcementId: null
    });

    // Check for the announcement once we know who is signed in, and again on
    // navigation in case they arrived on a page that skips it
    useEffect(() => {
        if (authLoading || !user) return;

        const checkAnnouncement = () => {
            // Never cover a reading page or the front door with a popup: visitors
            // from search land there, and Google penalizes interstitials over the
            // content. The update post itself doesn't need a popup pointing at it.
            const path = pathname || window.location.pathname;
            if (path === '/' || /^\/(learn|lyrics|login|pricing|about|updates)(\/|$)/.test(path)) return;

            const created = user.dateCreated ? new Date(user.dateCreated) : null;
            if (!created || created >= new Date(CURRENT_ANNOUNCEMENT.accountsCreatedBefore)) return;

            let seenAnnouncements = {};
            try {
                seenAnnouncements = JSON.parse(localStorage.getItem('seenAnnouncements') || '{}');
            } catch {}
            if (seenAnnouncements[CURRENT_ANNOUNCEMENT.id]) return;

            // Don't replace a popup that is already open
            setPopupState(prev => prev.show ? prev : {
                show: true,
                type: null,
                variant: 'announcement',
                announcementId: CURRENT_ANNOUNCEMENT.id
            });
        };

        // Small delay to ensure the page is loaded first
        const timer = setTimeout(checkAnnouncement, 1000);
        return () => clearTimeout(timer);
    }, [authLoading, user?.userId, pathname]);

    const showLimitReachedPopup = (type) => {
        setPopupState({
            show: true,
            type,
            variant: 'limit',
            announcementId: null
        });
    };

    const showLoginRequiredPopup = (type) => {
        setPopupState({
            show: true,
            type,
            variant: 'login',
            announcementId: null
        });
    };

    const showPromoPopup = () => {
        // Check if we should show the promo popup today
        const lastShownDate = localStorage.getItem('promoPopupLastShown');
        const today = new Date().toDateString();
        
        if (lastShownDate === today) {
            return false; // Already shown today
        }
        
        localStorage.setItem('promoPopupLastShown', today);
        
        setPopupState({
            show: true,
            type: null,
            variant: 'promo',
            announcementId: null
        });
        
        return true;
    };

    const hidePopup = () => {
        // If hiding an announcement, mark it as seen
        if (popupState.variant === 'announcement' && popupState.announcementId) {
            const seenAnnouncements = JSON.parse(localStorage.getItem('seenAnnouncements') || '{}');
            seenAnnouncements[popupState.announcementId] = true;
            localStorage.setItem('seenAnnouncements', JSON.stringify(seenAnnouncements));
        }
        
        setPopupState({
            show: false,
            type: null,
            variant: null,
            announcementId: null
        });
    };

    return (
        <PopupContext.Provider value={{ showLimitReachedPopup, showLoginRequiredPopup, showPromoPopup, hidePopup }}>
            {children}
            {popupState.show && popupState.variant === 'limit' && (
                <LimitReachedPopup 
                    onClose={hidePopup}
                    type={popupState.type}
                />
            )}
            {popupState.show && popupState.variant === 'login' && (
                <LoginRequiredPopup 
                    onClose={hidePopup}
                    type={popupState.type}
                />
            )}
            {popupState.show && popupState.variant === 'announcement' && (
                <AnnouncementPopup onClose={hidePopup} />
            )}
            {popupState.show && popupState.variant === 'promo' && (
                <PromoPopup 
                    onClose={hidePopup}
                />
            )}
        </PopupContext.Provider>
    );
}

export const usePopup = () => useContext(PopupContext); 
