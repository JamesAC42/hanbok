'use client';
import { createContext, useContext, useState } from 'react';
import LimitReachedPopup from '@/components/LimitReachedPopup';
import LoginRequiredPopup from '@/components/LoginRequiredPopup';

const PopupContext = createContext();

export function PopupProvider({ children }) {
    const [popupState, setPopupState] = useState({
        show: false,
        type: null,
        variant: null // 'limit' or 'login'
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

    const hidePopup = () => {
        setPopupState({
            show: false,
            type: null,
            variant: null
        });
    };

    return (
        <PopupContext.Provider value={{ showLimitReachedPopup, showLoginRequiredPopup }}>
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
        </PopupContext.Provider>
    );
}

export const usePopup = () => useContext(PopupContext); 