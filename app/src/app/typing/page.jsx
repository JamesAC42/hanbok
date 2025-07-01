'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/pages/typing.module.scss';
import Dashboard from '@/components/Dashboard';
import KoreanKeyboard from '@/components/typing/KoreanKeyboard';
import TypingArea from '@/components/typing/TypingArea';
import ModeSelector from '@/components/typing/ModeSelector';
import StatsDisplay from '@/components/typing/StatsDisplay';
import MobileOverlay from '@/components/typing/MobileOverlay';
import IMEModal from '@/components/typing/IMEModal';

const PRACTICE_MODES = {
    ROW_DRILL: 'row_drill',
    ALL_ROWS: 'all_rows',
    PARAGRAPH: 'paragraph'
};

const PRACTICE_PARAGRAPHS = [
    "안녕하세요. 저는 한국어를 배우고 있습니다. 매일 연습하면서 실력을 늘리고 있어요. 안녕하세요. 저는 한국어를 배우고 있습니다. 매일 연습하면서 실력을 늘리고 있어요.",
    "오늘 날씨가 정말 좋네요. 하늘이 맑고 바람도 시원합니다. 산책하기에 딱 좋은 날씨예요. 오늘 날씨가 정말 좋네요. 하늘이 맑고 바람도 시원합니다. 산책하기에 딱 좋은 날씨예요.",
    "한국 음식 중에서 김치찌개를 가장 좋아합니다. 매운맛이 일품이고 밥과 잘 어울려요. 한국 음식 중에서 김치찌개를 가장 좋아합니다. 매운맛이 일품이고 밥과 잘 어울려요.",
    "서울은 전통과 현대가 조화를 이루는 아름다운 도시입니다. 궁궐과 고층 빌딩이 함께 있어요. 서울은 전통과 현대가 조화를 이루는 아름다운 도시입니다. 궁궐과 고층 빌딩이 함께 있어요.",
    "책을 읽는 것은 지식을 늘리고 상상력을 기르는 좋은 방법입니다. 다양한 장르의 책을 읽어보세요. 책을 읽는 것은 지식을 늘리고 상상력을 기르는 좋은 방법입니다. 다양한 장르의 책을 읽어보세요.",
    "여행은 새로운 경험을 쌓고 다양한 문화를 이해하는 좋은 기회입니다. 세계 여러 나라를 여행해 보세요. 여행은 새로운 경험을 쌓고 다양한 문화를 이해하는 좋은 기회입니다. 세계 여러 나라를 여행해 보세요.",
    "운동은 건강을 유지하고 스트레스를 해소하는 데 도움이 됩니다. 규칙적으로 운동하는 습관을 길러보세요. 운동은 건강을 유지하고 스트레스를 해소하는 데 도움이 됩니다. 규칙적으로 운동하는 습관을 길러보세요.",
    "음악은 감정을 표현하고 마음을 치유하는 힘이 있습니다. 좋아하는 음악을 자주 들어보세요. 음악은 감정을 표현하고 마음을 치유하는 힘이 있습니다. 좋아하는 음악을 자주 들어보세요.",
    "요리는 창의력을 발휘하고 맛있는 음식을 즐길 수 있는 재미있는 활동입니다. 새로운 요리법을 시도해 보세요. 요리는 창의력을 발휘하고 맛있는 음식을 즐길 수 있는 재미있는 활동입니다. 새로운 요리법을 시도해 보세요.",
    "자연은 우리에게 평화와 안정을 줍니다. 자연 속에서 시간을 보내며 힐링해 보세요. 자연은 우리에게 평화와 안정을 줍니다. 자연 속에서 시간을 보내며 힐링해 보세요.",
    "예술은 우리의 삶을 풍요롭게 하고 다양한 시각을 제공합니다. 미술관이나 전시회를 방문해 보세요. 예술은 우리의 삶을 풍요롭게 하고 다양한 시각을 제공합니다. 미술관이나 전시회를 방문해 보세요."
];

// English to Korean character mapping (2-set Korean keyboard layout)
const ENGLISH_TO_KOREAN = {
    // Consonants
    'q': 'ㅂ', 'Q': 'ㅃ',
    'w': 'ㅈ', 'W': 'ㅉ',
    'e': 'ㄷ', 'E': 'ㄸ',
    'r': 'ㄱ', 'R': 'ㄲ',
    't': 'ㅅ', 'T': 'ㅆ',
    'a': 'ㅁ',
    's': 'ㄴ',
    'd': 'ㅇ',
    'f': 'ㄹ',
    'g': 'ㅎ',
    'z': 'ㅋ',
    'x': 'ㅌ',
    'c': 'ㅊ',
    'v': 'ㅍ',
    
    // Vowels
    'y': 'ㅛ',
    'u': 'ㅕ',
    'i': 'ㅑ',
    'o': 'ㅐ', 'O': 'ㅒ',
    'p': 'ㅔ', 'P': 'ㅖ',
    'h': 'ㅗ',
    'j': 'ㅓ',
    'k': 'ㅏ',
    'l': 'ㅣ',
    'b': 'ㅠ',
    'n': 'ㅜ',
    'm': 'ㅡ',
    
    // Special characters that might appear in text
    ' ': ' ',
    '.': '.',
    ',': ',',
    '?': '?',
    '!': '!',
    ':': ':',
    ';': ';',
    '(': '(',
    ')': ')',
    '-': '-',
    '_': '_',
    '"': '"',
    "'": "'",
    '/': '/',
    '\\': '\\',
    '&': '&',
    '%': '%',
    '#': '#',
    '@': '@',
    '*': '*',
    '+': '+',
    '=': '=',
    '[': '[',
    ']': ']',
    '{': '{',
    '}': '}',
    '<': '<',
    '>': '>',
    '|': '|',
    '`': '`',
    '~': '~',
    '^': '^',
    '$': '$'
};

const KEYBOARD_ROWS = {
    1: ['ㅂ', 'ㅃ', 'ㅈ', 'ㅉ', 'ㄷ', 'ㄸ', 'ㄱ', 'ㄲ', 'ㅅ', 'ㅆ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ'],
    2: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
    3: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ']
};

export default function TypingPractice() {
    const { t } = useLanguage();
    
    const [isMobile, setIsMobile] = useState(false);
    const [currentMode, setCurrentMode] = useState(PRACTICE_MODES.ROW_DRILL);
    const [currentRow, setCurrentRow] = useState(1);
    const [currentText, setCurrentText] = useState('');
    const [userInput, setUserInput] = useState('');
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [errors, setErrors] = useState(0);
    const [totalCharacters, setTotalCharacters] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
    const [showIMEModal, setShowIMEModal] = useState(false);
    const [pendingMode, setPendingMode] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    
    const inputRef = useRef(null);
    
    useEffect(() => {
        document.title = 'Hanbok - Korean Typing Practice';
        
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);
    
    useEffect(() => {
        generateNewText();
    }, [currentMode, currentRow, currentParagraphIndex]);
    
    const generateNewText = (resetStats = true) => {
        let newText = '';
        
        switch (currentMode) {
            case PRACTICE_MODES.ROW_DRILL:
                const rowChars = KEYBOARD_ROWS[currentRow];
                newText = rowChars[Math.floor(Math.random() * rowChars.length)];
                break;
                
            case PRACTICE_MODES.ALL_ROWS:
                const allChars = Object.values(KEYBOARD_ROWS).flat();
                newText = allChars[Math.floor(Math.random() * allChars.length)];
                break;
                
            case PRACTICE_MODES.PARAGRAPH:
                newText = PRACTICE_PARAGRAPHS[currentParagraphIndex];
                break;
        }
        
        setCurrentText(newText);
        setUserInput('');
        setCurrentCharIndex(0);
        setIsCompleted(false);
        
        // Only reset stats when explicitly requested (mode changes, new sessions)
        if (resetStats) {
            setErrors(0);
            setStartTime(null);
            setEndTime(null);
            setIsActive(false);
        }
        
        // For paragraph mode, always set total characters
        // For character modes, accumulate total characters if not resetting stats
        if (currentMode === PRACTICE_MODES.PARAGRAPH || resetStats) {
            setTotalCharacters(newText.length);
        } else {
            // Add to total characters for character mode tracking
            setTotalCharacters(prev => prev + newText.length);
        }
    };
    
    // Convert English input to Korean characters
    const convertToKorean = (englishInput) => {
        return englishInput.split('').map(char => {
            // Convert to Korean if mapping exists, otherwise keep original character
            const koreanChar = ENGLISH_TO_KOREAN[char];
            return koreanChar !== undefined ? koreanChar : char;
        }).join('');
    };

    const handleInputChange = (value) => {
        // Don't allow input changes if paragraph is completed
        if (currentMode === PRACTICE_MODES.PARAGRAPH && isCompleted) {
            return;
        }
        
        let limitedValue;
        
        if (currentMode === PRACTICE_MODES.PARAGRAPH) {
            // For paragraph mode, use the input directly (Korean IME input)
            // Also prevent backspacing if we're completed
            if (isCompleted && value.length < userInput.length) {
                return;
            }
            limitedValue = value.substring(0, currentText.length);
        } else {
            // For character modes, convert English input to Korean
            const koreanValue = convertToKorean(value);
            limitedValue = koreanValue.substring(0, currentText.length);
        }
        
        if (!startTime && limitedValue.length > 0) {
            setStartTime(Date.now());
            setIsActive(true);
        }
        
        setUserInput(limitedValue);
        
        // Check for errors
        let currentErrors = 0;
        for (let i = 0; i < limitedValue.length; i++) {
            if (limitedValue[i] !== currentText[i]) {
                currentErrors++;
            }
        }
        
        // For paragraph mode, set errors directly
        // For character modes, errors are tracked cumulatively when characters complete
        if (currentMode === PRACTICE_MODES.PARAGRAPH) {
            setErrors(currentErrors);
        }
        
        setCurrentCharIndex(limitedValue.length);
        
        // Check if completed
        if (limitedValue === currentText) {
            setEndTime(Date.now());
            
            if (currentMode === PRACTICE_MODES.PARAGRAPH) {
                // For paragraph mode, mark as completed but keep timer showing
                setIsCompleted(true);
                setIsActive(false); // Stop the live timer but keep showing final time
            } else {
                // For character modes, stop and auto-advance
                setIsActive(false);
                // Auto-generate next character/text for single character modes
                setTimeout(() => {
                    generateNewText(false); // Don't reset stats when auto-advancing
                }, 500);
            }
        } else if (limitedValue.length === currentText.length && currentMode !== PRACTICE_MODES.PARAGRAPH) {
            // In character modes, if user typed wrong character but filled the length, count as error and advance
            setErrors(prev => prev + 1);
            setTimeout(() => {
                generateNewText(false); // Don't reset stats when auto-advancing
            }, 500);
        }
    };
    
    const handleModeChange = (mode) => {
        setCurrentMode(mode);
    };
    
    const handleRowChange = (row) => {
        setCurrentRow(row);
    };
    
    const handleNewParagraph = () => {
        const nextIndex = (currentParagraphIndex + 1) % PRACTICE_PARAGRAPHS.length;
        setCurrentParagraphIndex(nextIndex);
    };

    const handleSkipCharacter = () => {
        // Only allow skipping in character modes
        if (currentMode !== PRACTICE_MODES.PARAGRAPH) {
            // Count the skipped character as an error
            setErrors(prev => prev + 1);
            // Generate new text without resetting stats
            generateNewText(false);
        }
    };

    const handleShowIMEModal = (mode) => {
        setPendingMode(mode);
        setShowIMEModal(true);
    };
    
    const handleIMEModalConfirm = () => {
        if (pendingMode) {
            setCurrentMode(pendingMode);
            setPendingMode(null);
            // Reset input state when switching to paragraph mode
            setUserInput('');
            setCurrentCharIndex(0);
            setStartTime(null);
            setEndTime(null);
            setIsActive(false);
            setIsCompleted(false);
        }
        setShowIMEModal(false);
    };
    
    const handleIMEModalClose = () => {
        setShowIMEModal(false);
        setPendingMode(null);
    };
    
    const calculateWPM = () => {
        if (!startTime || !endTime) return 0;
        const timeInMinutes = (endTime - startTime) / 60000;
        const wordsTyped = currentText.length / 5; // Standard: 5 characters = 1 word
        return Math.round(wordsTyped / timeInMinutes);
    };
    
    const calculateAccuracy = () => {
        if (totalCharacters === 0) return 100;
        return Math.round(((totalCharacters - errors) / totalCharacters) * 100);
    };
    
    if (isMobile) {
        return <MobileOverlay />;
    }
    
    return (
        <>
            <Dashboard>
                <div className={styles.typingContainer}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Korean Typing Practice</h1>
                        <p className={styles.subtitle}>
                            {currentMode === PRACTICE_MODES.PARAGRAPH 
                                ? "Practice typing Korean paragraphs with your Korean IME enabled!" 
                                : "Practice Korean characters using your English keyboard - no Korean IME required!"
                            }
                        </p>
                    </div>
                
                <div className={styles.mainLayout}>
                    <div className={styles.leftPanel}>
                        <ModeSelector
                            currentMode={currentMode}
                            onModeChange={handleModeChange}
                            currentRow={currentRow}
                            onRowChange={handleRowChange}
                            onNewParagraph={handleNewParagraph}
                            modes={PRACTICE_MODES}
                            onShowIMEModal={handleShowIMEModal}
                        />
                    </div>
                    
                    <div className={styles.rightPanel}>
                        <div className={styles.practiceArea}>
                            <TypingArea
                                currentText={currentText}
                                userInput={userInput}
                                onInputChange={handleInputChange}
                                currentCharIndex={currentCharIndex}
                                isActive={isActive}
                                mode={currentMode}
                                inputRef={inputRef}
                                onSkipCharacter={handleSkipCharacter}
                                isCompleted={isCompleted}
                            />
                            
                            <StatsDisplay
                                wpm={calculateWPM()}
                                accuracy={calculateAccuracy()}
                                errors={errors}
                                isActive={isActive}
                                startTime={startTime}
                                mode={currentMode}
                                isCompleted={isCompleted}
                                endTime={endTime}
                            />
                        </div>
                        
                        <div className={styles.keyboardSection}>
                            <KoreanKeyboard
                                currentChar={currentMode !== PRACTICE_MODES.PARAGRAPH ? currentText : currentText[currentCharIndex]}
                                pressedKeys={[]}
                            />
                        </div>
                    </div>
                </div>
            </div>
            </Dashboard>
            
            <IMEModal
                isOpen={showIMEModal}
                onClose={handleIMEModalClose}
                onConfirm={handleIMEModalConfirm}
            />
        </>
    );
} 