import { useState, useEffect } from 'react';
import styles from '@/styles/components/typing/keyboard.module.scss';

const KEYBOARD_LAYOUT = [
    // Row 1 - Numbers and symbols
    [
        { key: '1', korean: '', shift: '!' },
        { key: '2', korean: '', shift: '@' },
        { key: '3', korean: '', shift: '#' },
        { key: '4', korean: '', shift: '$' },
        { key: '5', korean: '', shift: '%' },
        { key: '6', korean: '', shift: '^' },
        { key: '7', korean: '', shift: '&' },
        { key: '8', korean: '', shift: '*' },
        { key: '9', korean: '', shift: '(' },
        { key: '0', korean: '', shift: ')' },
        { key: '-', korean: '', shift: '_' },
        { key: '=', korean: '', shift: '+' },
    ],
    // Row 2 - Top consonants and vowels
    [
        { key: 'q', korean: 'ㅂ', shift: 'ㅃ' },
        { key: 'w', korean: 'ㅈ', shift: 'ㅉ' },
        { key: 'e', korean: 'ㄷ', shift: 'ㄸ' },
        { key: 'r', korean: 'ㄱ', shift: 'ㄲ' },
        { key: 't', korean: 'ㅅ', shift: 'ㅆ' },
        { key: 'y', korean: 'ㅛ', shift: '' },
        { key: 'u', korean: 'ㅕ', shift: '' },
        { key: 'i', korean: 'ㅑ', shift: '' },
        { key: 'o', korean: 'ㅐ', shift: 'ㅒ' },
        { key: 'p', korean: 'ㅔ', shift: 'ㅖ' },
        { key: '[', korean: '', shift: '{' },
        { key: ']', korean: '', shift: '}' },
    ],
    // Row 3 - Home row
    [
        { key: 'a', korean: 'ㅁ', shift: '' },
        { key: 's', korean: 'ㄴ', shift: '' },
        { key: 'd', korean: 'ㅇ', shift: '' },
        { key: 'f', korean: 'ㄹ', shift: '' },
        { key: 'g', korean: 'ㅎ', shift: '' },
        { key: 'h', korean: 'ㅗ', shift: '' },
        { key: 'j', korean: 'ㅓ', shift: '' },
        { key: 'k', korean: 'ㅏ', shift: '' },
        { key: 'l', korean: 'ㅣ', shift: '' },
        { key: ';', korean: '', shift: ':' },
        { key: "'", korean: '', shift: '"' },
    ],
    // Row 4 - Bottom row
    [
        { key: 'z', korean: 'ㅋ', shift: '' },
        { key: 'x', korean: 'ㅌ', shift: '' },
        { key: 'c', korean: 'ㅊ', shift: '' },
        { key: 'v', korean: 'ㅍ', shift: '' },
        { key: 'b', korean: 'ㅠ', shift: '' },
        { key: 'n', korean: 'ㅜ', shift: '' },
        { key: 'm', korean: 'ㅡ', shift: '' },
        { key: ',', korean: '', shift: '<' },
        { key: '.', korean: '', shift: '>' },
        { key: '/', korean: '', shift: '?' },
    ]
];

export default function KoreanKeyboard({ currentChar, pressedKeys = [] }) {
    const [highlightedKey, setHighlightedKey] = useState(null);
    
    useEffect(() => {
        if (currentChar) {
            // Find which key produces the current character
            let foundKey = null;
            
            for (const row of KEYBOARD_LAYOUT) {
                for (const keyInfo of row) {
                    if (keyInfo.korean === currentChar || keyInfo.shift === currentChar) {
                        foundKey = keyInfo.key;
                        break;
                    }
                }
                if (foundKey) break;
            }
            
            setHighlightedKey(foundKey);
        } else {
            setHighlightedKey(null);
        }
    }, [currentChar]);
    
    const getKeyClass = (keyInfo) => {
        let className = styles.key;
        
        if (highlightedKey === keyInfo.key) {
            className += ` ${styles.highlighted}`;
        }
        
        if (pressedKeys.includes(keyInfo.key)) {
            className += ` ${styles.pressed}`;
        }
        
        // Special key styling
        if (!keyInfo.korean) {
            className += ` ${styles.specialKey}`;
        }
        
        return className;
    };
    
    return (
        <div className={styles.keyboard}>
            <div className={styles.keyboardHeader}>
                <h3>Korean Keyboard Layout</h3>
                {currentChar && (
                    <div className={styles.currentChar}>
                        Type: <span className={styles.charDisplay}>{currentChar}</span>
                    </div>
                )}
            </div>
            
            <div className={styles.keyboardLayout}>
                {KEYBOARD_LAYOUT.map((row, rowIndex) => (
                    <div key={rowIndex} className={styles.keyRow}>
                        {rowIndex === 0 && (
                            <div className={`${styles.key} ${styles.specialKey} ${styles.tab}`}>
                                Tab
                            </div>
                        )}
                        {rowIndex === 1 && (
                            <div className={`${styles.key} ${styles.specialKey} ${styles.tab}`}>
                                Tab
                            </div>
                        )}
                        {rowIndex === 2 && (
                            <div className={`${styles.key} ${styles.specialKey} ${styles.capsLock}`}>
                                Caps
                            </div>
                        )}
                        {rowIndex === 3 && (
                            <div className={`${styles.key} ${styles.specialKey} ${styles.shift}`}>
                                Shift
                            </div>
                        )}
                        
                        {row.map((keyInfo, keyIndex) => (
                            <div
                                key={keyIndex}
                                className={getKeyClass(keyInfo)}
                            >
                                <div className={styles.keyTop}>
                                    {keyInfo.shift && (
                                        <span className={styles.shiftChar}>{keyInfo.shift}</span>
                                    )}
                                </div>
                                <div className={styles.keyMain}>
                                    {keyInfo.korean || keyInfo.key.toUpperCase()}
                                </div>
                                <div className={styles.keyBottom}>
                                    {keyInfo.korean && (
                                        <span className={styles.englishChar}>{keyInfo.key.toUpperCase()}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {rowIndex === 0 && (
                            <div className={`${styles.key} ${styles.specialKey} ${styles.backspace}`}>
                                Backspace
                            </div>
                        )}
                        {rowIndex === 1 && (
                            <div className={`${styles.key} ${styles.specialKey} ${styles.backslash}`}>
                                \
                            </div>
                        )}
                        {rowIndex === 2 && (
                            <div className={`${styles.key} ${styles.specialKey} ${styles.enter}`}>
                                Enter
                            </div>
                        )}
                        {rowIndex === 3 && (
                            <div className={`${styles.key} ${styles.specialKey} ${styles.shift}`}>
                                Shift
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Spacebar row */}
                <div className={styles.keyRow}>
                    <div className={`${styles.key} ${styles.specialKey} ${styles.ctrl}`}>Ctrl</div>
                    <div className={`${styles.key} ${styles.specialKey} ${styles.alt}`}>Alt</div>
                    <div className={`${styles.key} ${styles.specialKey} ${styles.spacebar}`}>Space</div>
                    <div className={`${styles.key} ${styles.specialKey} ${styles.alt}`}>Alt</div>
                    <div className={`${styles.key} ${styles.specialKey} ${styles.ctrl}`}>Ctrl</div>
                </div>
            </div>
            
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendKey} ${styles.highlighted}`}></div>
                    <span>Target Key</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendKey} ${styles.pressed}`}></div>
                    <span>Pressed</span>
                </div>
            </div>
        </div>
    );
} 