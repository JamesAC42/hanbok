import { useEffect } from 'react';
import styles from '@/styles/components/typing/typingarea.module.scss';

export default function TypingArea({ 
    currentText, 
    userInput, 
    onInputChange, 
    currentCharIndex, 
    isActive, 
    mode, 
    inputRef,
    onSkipCharacter,
    isCompleted 
}) {
    
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentText]);

    // Keep input focused when clicking anywhere in the typing area
    const handleAreaClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Refocus input if it loses focus (except when clicking outside the typing area)
    const handleInputBlur = (e) => {
        // Small delay to allow other focus events to complete
        setTimeout(() => {
            if (inputRef.current && document.activeElement !== inputRef.current) {
                inputRef.current.focus();
            }
        }, 10);
    };
    
    const handleInputChange = (e) => {
        onInputChange(e.target.value);
    };



    const handleKeyDown = (e) => {
        // Prevent most keyboard input when paragraph is completed
        if (mode === 'paragraph' && isCompleted) {
            // Allow only copy/select keys, prevent typing/backspace/delete
            if (!e.ctrlKey && !e.metaKey && 
                !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
                e.preventDefault();
                return;
            }
        }
        
        // In character modes, allow Enter to skip only if user has typed an incorrect character
        if ((mode === 'row_drill' || mode === 'all_rows') && e.key === 'Enter') {
            e.preventDefault();
            // Only skip if there's input and it's incorrect
            if (userInput.length > 0 && userInput !== currentText && onSkipCharacter) {
                onSkipCharacter();
            }
        }
    };
    
    const renderText = () => {
        if (mode === 'paragraph') {
            // Only render paragraph content if text is actually a paragraph (longer than 1 character)
            if (currentText.length <= 1) {
                return <div className={styles.paragraphText}></div>;
            }
            
            return (
                <div className={`${styles.paragraphText} ${isCompleted ? styles.completed : ''}`}>
                    {currentText.split('').map((char, index) => {
                        let className = styles.char;
                        
                        if (index < userInput.length) {
                            // We have typed something at this position
                            if (index === currentCharIndex) {
                                // We're currently typing this character (IME in progress)
                                className += ` ${styles.inProgress}`;
                            } else if (userInput[index] === char) {
                                // Character is fully typed and correct
                                className += ` ${styles.correct}`;
                            } else {
                                // Character is fully typed but incorrect
                                className += ` ${styles.incorrect}`;
                            }
                        } else if (index === currentCharIndex) {
                            // Current character to type (nothing typed yet)
                            className += ` ${styles.current}`;
                        } else {
                            // Not yet typed
                            className += ` ${styles.pending}`;
                        }
                        
                        return (
                            <span key={index} className={className}>
                                {char === ' ' ? '␣' : char}
                            </span>
                        );
                    })}
                </div>
            );
        } else {
            // Single character modes - only render if text is actually a single character
            if (currentText.length > 1) {
                return <div className={styles.singleChar}></div>;
            }
            
            return (
                <div className={styles.singleChar}>
                    <div className={styles.targetChar}>
                        {currentText}
                    </div>
                    {userInput && (
                        <div className={styles.userChar}>
                            <span className={userInput === currentText ? styles.correct : styles.incorrect}>
                                {userInput}
                            </span>
                        </div>
                    )}
                </div>
            );
        }
    };
    
    return (
        <div className={styles.typingArea} key={mode} onClick={handleAreaClick}>
            <div className={styles.textDisplay}>
                {renderText()}
            </div>
            
            <div className={styles.inputSection}>
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleInputBlur}
                    className={styles.hiddenInput}
                    placeholder={mode === 'paragraph' ? "Start typing with Korean IME..." : "Start typing with your English keyboard..."}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    inputMode="text"
                    lang={mode === 'paragraph' ? "ko" : "en"}
                />
                
                <div className={styles.inputDisplay}>
                    <div className={styles.inputLabel}>Your input:</div>
                    <div className={styles.inputText}>
                        {userInput || <span className={styles.placeholder}>Start typing...</span>}
                    </div>
                </div>
            </div>
            
            <div className={styles.instructions}>
                {mode === 'paragraph' ? (
                    isCompleted ? (
                        <p><strong>🎉 Well done!</strong> You completed the paragraph! Check your final time and WPM above. Click "New Paragraph" to try another one.</p>
                    ) : (
                        <p>Type the paragraph above using your <strong>Korean IME</strong>. Make sure you have Korean input enabled on your system. Correct characters will appear in green, incorrect in red.</p>
                    )
                ) : (
                    <p>Type the Korean character shown above using your English keyboard. Use <strong>Shift</strong> for aspirated characters (ㅃ, ㅉ, ㄸ, ㄲ, ㅆ, ㅒ, ㅖ). The keyboard below shows which English key to press. A new character will appear automatically, or press <strong>Enter</strong> to skip if you make a mistake.</p>
                )}
            </div>
        </div>
    );
} 