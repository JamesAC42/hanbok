'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import LimitReachedPopup from '@/components/LimitReachedPopup';
import LoginRequiredPopup from '@/components/LoginRequiredPopup';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import PromoPopup from '@/components/PromoPopup';

const PopupContext = createContext();

// Current announcement data
const CURRENT_ANNOUNCEMENT = {
    id: '2025-07-01', // Use this as a key to track in localStorage
    content: {
        // Content will be pulled from translations
    }
};

export function PopupProvider({ children }) {
    const [popupState, setPopupState] = useState({
        show: false,
        type: null,
        variant: null, // 'limit', 'login', or 'announcement'
        announcementId: null
    });

    // Check for announcements on initial load
    useEffect(() => {
        const checkAnnouncement = () => {
            // Skip if another popup is already showing
            if (popupState.show) return;
            
            // Check if user has seen this announcement
            const seenAnnouncements = JSON.parse(localStorage.getItem('seenAnnouncements') || '{}');
            
            if (!seenAnnouncements[CURRENT_ANNOUNCEMENT.id]) {
                // Show the announcement if not seen
                setPopupState({
                    show: true,
                    type: null,
                    variant: 'announcement',
                    announcementId: CURRENT_ANNOUNCEMENT.id
                });
            }
        };
        
        // Small delay to ensure the page is loaded first
        const timer = setTimeout(checkAnnouncement, 1000);
        return () => clearTimeout(timer);
    }, []);

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
                <AnnouncementPopup 
                    onClose={hidePopup}
                    announcementId={popupState.announcementId}
                    content={CURRENT_ANNOUNCEMENT.content}
                />
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