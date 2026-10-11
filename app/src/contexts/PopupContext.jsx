'use client';
import { createContext, useContext, useState } from 'react';
import LimitReachedPopup from '@/components/LimitReachedPopup';
import LoginRequiredPopup from '@/components/LoginRequiredPopup';
import PromoPopup from '@/components/PromoPopup';
import HeardFromPrompt from '@/components/HeardFromPrompt';

const PopupContext = createContext();

export function PopupProvider({ children }) {
    const [popupState, setPopupState] = useState({
        show: false,
        type: null,
        variant: null, // 'limit', 'login' or 'promo'
    });

    const showLimitReachedPopup = (type) => {
        setPopupState({
            show: true,
            type,
            variant: 'limit'
        });
    };

    const showLoginRequiredPopup = (type) => {
        setPopupState({
            show: true,
            type,
            variant: 'login'
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
            variant: 'promo'
        });
        
        return true;
    };

    const hidePopup = () => {
        setPopupState({
            show: false,
            type: null,
            variant: null
        });
    };

    return (
        <PopupContext.Provider value={{ showLimitReachedPopup, showLoginRequiredPopup, showPromoPopup, hidePopup }}>
            {children}
            {!popupState.show && <HeardFromPrompt />}
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
            {popupState.show && popupState.variant === 'promo' && (
                <PromoPopup 
                    onClose={hidePopup}
                />
            )}
        </PopupContext.Provider>
    );
}

export const usePopup = () => useContext(PopupContext); 
