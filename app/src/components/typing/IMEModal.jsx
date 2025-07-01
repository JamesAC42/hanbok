import { useState } from 'react';
import styles from '@/styles/components/typing/imemodal.module.scss';

export default function IMEModal({ isOpen, onClose, onConfirm }) {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleConfirm = () => {
        if (dontShowAgain) {
            localStorage.setItem('hanbok_ime_explained', 'true');
        }
        onConfirm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Korean IME Required</h2>
                </div>
                
                <div className={styles.content}>
                    <p className={styles.explanation}>
                        For paragraph practice, you'll need a <strong>Korean Input Method Editor (IME)</strong> to type Korean syllable blocks correctly.
                    </p>
                    
                    <div className={styles.whatIsIME}>
                        <h3>What is an IME?</h3>
                        <p>
                            An IME allows you to type Korean by combining consonants and vowels into complete syllable blocks. For example, typing "ㅎ", "ㅏ", "ㄴ" creates "한".
                        </p>
                    </div>
                    
                    <div className={styles.instructions}>
                        <h3>How to Enable Korean IME:</h3>
                        
                        <div className={styles.osInstructions}>
                            <div className={styles.osSection}>
                                <h4>🪟 Windows:</h4>
                                <ol>
                                    <li>Press <kbd>Windows + I</kbd> to open Settings</li>
                                    <li>Go to <strong>Time & Language</strong> → <strong>Language</strong></li>
                                    <li>Click <strong>Add a language</strong> and select <strong>Korean</strong></li>
                                    <li>Use <kbd>Windows + Space</kbd> to switch between languages</li>
                                </ol>
                            </div>
                            
                            <div className={styles.osSection}>
                                <h4>🍎 macOS:</h4>
                                <ol>
                                    <li>Go to <strong>System Preferences</strong> → <strong>Keyboard</strong></li>
                                    <li>Click <strong>Input Sources</strong> → <strong>+</strong> button</li>
                                    <li>Select <strong>Korean</strong> → <strong>2-Set Korean</strong></li>
                                    <li>Use <kbd>Cmd + Space</kbd> to switch input methods</li>
                                </ol>
                            </div>
                            
                            <div className={styles.osSection}>
                                <h4>🐧 Linux:</h4>
                                <ol>
                                    <li>Install <strong>ibus-hangul</strong> or <strong>fcitx</strong></li>
                                    <li>Add Korean to your input methods</li>
                                    <li>Use <kbd>Super + Space</kbd> to switch languages</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.note}>
                        <p><strong>Note:</strong> Character practice modes will continue to work with your English keyboard and automatic conversion.</p>
                    </div>
                </div>
                
                <div className={styles.footer}>
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                        />
                        <span>Don't show this again</span>
                    </label>
                    
                    <div className={styles.buttons}>
                        <button 
                            className={styles.cancelButton}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button 
                            className={styles.continueButton}
                            onClick={handleConfirm}
                        >
                            I have Korean IME enabled
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 