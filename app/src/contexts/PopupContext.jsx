'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import LimitReachedPopup from '@/components/LimitReachedPopup';
import LoginRequiredPopup from '@/components/LoginRequiredPopup';
import AnnouncementPopup from '@/components/AnnouncementPopup';

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
        <PopupContext.Provider value={{ showLimitReachedPopup, showLoginRequiredPopup, hidePopup }}>
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
        </PopupContext.Provider>
    );
}

export const usePopup = () => useContext(PopupContext); 