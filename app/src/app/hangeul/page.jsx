'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/pages/hangeul.module.scss';
import Dashboard from '@/components/Dashboard';
import Image from 'next/image';
import { MaterialSymbolsCheckCircleOutlineRounded } from '@/components/icons/CheckCircle';
import { MaterialSymbolsCancel } from '@/components/icons/Close';

// Korean consonants data with memory tips
const CONSONANTS = [
    {
        character: 'ㄱ',
        name: 'giyeok',
        sound: 'g',
        keyword: 'gun',
        tip: 'Looks like a gun barrel - "g" sound',
        example: 'Like "g" in "gun"'
    },
    {
        character: 'ㄴ',
        name: 'nieun',
        sound: 'n',
        keyword: 'nose',
        tip: 'Looks like a nose in profile - "n" sound',
        example: 'Like "n" in "nose"'
    },
    {
        character: 'ㄷ',
        name: 'digeut',
        sound: 'd',
        keyword: 'door',
        tip: 'Looks like a door frame - "d" sound',
        example: 'Like "d" in "door"'
    },
    {
        character: 'ㄹ',
        name: 'rieul',
        sound: 'r/l',
        keyword: 'rattlesnake',
        tip: 'Curved like a rattlesnake - "r/l" sound',
        example: 'Like "r" in "run" or "l" in "love"'
    },
    {
        character: 'ㅁ',
        name: 'mieum',
        sound: 'm',
        keyword: 'mouth',
        tip: 'Square like a mouth - "m" sound',
        example: 'Like "m" in "mouth"'
    },
    {
        character: 'ㅂ',
        name: 'bieup',
        sound: 'b',
        keyword: 'bucket',
        tip: 'Looks like a bucket - "b" sound',
        example: 'Like "b" in "bucket"'
    },
    {
        character: 'ㅅ',
        name: 'siot',
        sound: 's',
        keyword: 'slope',
        tip: 'Shaped like a slope - "s" sound',
        example: 'Like "s" in "slope"'
    },
    {
        character: 'ㅇ',
        name: 'ieung',
        sound: 'silent/ng',
        keyword: 'no sound',
        tip: 'Circle = silent at start, "ng" at end',
        example: 'Silent at beginning, "ng" at end like "ring"'
    },
    {
        character: 'ㅈ',
        name: 'jieut',
        sound: 'j',
        keyword: 'jeans',
        tip: 'Looks like the letter J - "j" sound',
        example: 'Like "j" in "jeans"'
    },
    {
        character: 'ㅊ',
        name: 'chieut',
        sound: 'ch',
        keyword: 'chicken',
        tip: 'ㅈ with extra line = "ch" sound',
        example: 'Like "ch" in "chicken"'
    },
    {
        character: 'ㅋ',
        name: 'kieuk',
        sound: 'k',
        keyword: 'kill (with a gun)',
        tip: 'ㄱ with extra line = harder "k" sound',
        example: 'Like "k" in "kill"'
    },
    {
        character: 'ㅌ',
        name: 'tieut',
        sound: 't',
        keyword: 'two doors',
        tip: 'ㄷ with extra line = harder "t" sound',
        example: 'Like "t" in "top"'
    },
    {
        character: 'ㅍ',
        name: 'pieup',
        sound: 'p',
        keyword: 'pillar',
        tip: 'ㅂ with extra line = harder "p" sound',
        example: 'Like "p" in "pillar"'
    },
    {
        character: 'ㅎ',
        name: 'hieut',
        sound: 'h',
        keyword: 'hat',
        tip: 'Looks like a hat - "h" sound',
        example: 'Like "h" in "hat"'
    },
    {
        character: 'ㄲ',
        name: 'ssang giyeok',
        sound: 'kk',
        keyword: 'double gun',
        tip: 'Double ㄱ = tense "kk" sound',
        example: 'Like "ck" in "back kick"'
    },
    {
        character: 'ㄸ',
        name: 'ssang digeut',
        sound: 'tt',
        keyword: 'double door',
        tip: 'Double ㄷ = tense "tt" sound',
        example: 'Like "tt" in "butter"'
    },
    {
        character: 'ㅃ',
        name: 'ssang bieup',
        sound: 'pp',
        keyword: 'double bucket',
        tip: 'Double ㅂ = tense "pp" sound',
        example: 'Like "pp" in "happy"'
    },
    {
        character: 'ㅆ',
        name: 'ssang siot',
        sound: 'ss',
        keyword: 'double slope',
        tip: 'Double ㅅ = tense "ss" sound',
        example: 'Like "ss" in "hiss"'
    },
    {
        character: 'ㅉ',
        name: 'ssang jieut',
        sound: 'jj',
        keyword: 'double jeans',
        tip: 'Double ㅈ = tense "jj" sound',
        example: 'Like "dge" in "edge"'
    }
];

// Korean vowels data
const VOWELS = [
    {
        character: 'ㅏ',
        name: 'a',
        sound: 'a',
        keyword: 'father',
        tip: 'Vertical line with right dash - "ah" sound',
        example: 'Like "a" in "father"'
    },
    {
        character: 'ㅓ',
        name: 'eo',
        sound: 'eo',
        keyword: 'awesome',
        tip: 'Vertical line with left dash - "uh" sound',
        example: 'Like "o" in "awesome"'
    },
    {
        character: 'ㅗ',
        name: 'o',
        sound: 'o',
        keyword: 'boat',
        tip: 'Horizontal line with bottom dash - "oh" sound',
        example: 'Like "o" in "boat"'
    },
    {
        character: 'ㅜ',
        name: 'u',
        sound: 'u',
        keyword: 'moon',
        tip: 'Horizontal line with top dash - "oo" sound',
        example: 'Like "oo" in "moon"'
    },
    {
        character: 'ㅡ',
        name: 'eu',
        sound: 'eu',
        keyword: 'brook',
        tip: 'Just horizontal line - "uh" sound',
        example: 'Like "oo" in "brook" but shorter'
    },
    {
        character: 'ㅣ',
        name: 'i',
        sound: 'i',
        keyword: 'sheep',
        tip: 'Just vertical line - "ee" sound',
        example: 'Like "ee" in "sheep"'
    },
    {
        character: 'ㅑ',
        name: 'ya',
        sound: 'ya',
        keyword: 'yard',
        tip: 'ㅏ with extra dash - "yah" sound',
        example: 'Like "ya" in "yard"'
    },
    {
        character: 'ㅕ',
        name: 'yeo',
        sound: 'yeo',
        keyword: 'young',
        tip: 'ㅓ with extra dash - "yuh" sound',
        example: 'Like "yo" in "young"'
    },
    {
        character: 'ㅛ',
        name: 'yo',
        sound: 'yo',
        keyword: 'yogurt',
        tip: 'ㅗ with extra dash - "yoh" sound',
        example: 'Like "yo" in "yogurt"'
    },
    {
        character: 'ㅠ',
        name: 'yu',
        sound: 'yu',
        keyword: 'you',
        tip: 'ㅜ with extra dash - "yoo" sound',
        example: 'Like "you"'
    },
    {
        character: 'ㅐ',
        name: 'ae',
        sound: 'ae',
        keyword: 'cat',
        tip: 'ㅏ + ㅣ combined - "eh" sound',
        example: 'Like "a" in "cat"'
    },
    {
        character: 'ㅔ',
        name: 'e',
        sound: 'e',
        keyword: 'bed',
        tip: 'ㅓ + ㅣ combined - "eh" sound',
        example: 'Like "e" in "bed"'
    },
    {
        character: 'ㅘ',
        name: 'wa',
        sound: 'wa',
        keyword: 'water',
        tip: 'ㅗ + ㅏ combined - "wah" sound',
        example: 'Like "wa" in "water"'
    },
    {
        character: 'ㅙ',
        name: 'wae',
        sound: 'wae',
        keyword: 'wax',
        tip: 'ㅗ + ㅐ combined - "way" sound',
        example: 'Like "wa" in "wax"'
    },
    {
        character: 'ㅚ',
        name: 'oe',
        sound: 'oe',
        keyword: 'way',
        tip: 'ㅗ + ㅣ combined - "way/we" sound',
        example: 'Like "way" or "we"'
    },
    {
        character: 'ㅝ',
        name: 'wo',
        sound: 'wo',
        keyword: 'won',
        tip: 'ㅜ + ㅓ combined - "wuh" sound',
        example: 'Like "wo" in "won"'
    },
    {
        character: 'ㅞ',
        name: 'we',
        sound: 'we',
        keyword: 'wet',
        tip: 'ㅜ + ㅔ combined - "weh" sound',
        example: 'Like "we" in "wet"'
    },
    {
        character: 'ㅟ',
        name: 'wi',
        sound: 'wi',
        keyword: 'week',
        tip: 'ㅜ + ㅣ combined - "wee" sound',
        example: 'Like "wi" in "week"'
    },
    {
        character: 'ㅢ',
        name: 'ui',
        sound: 'ui',
        keyword: 'we',
        tip: 'ㅡ + ㅣ combined - "we/ui" sound',
        example: 'Like "we" or unique "ui" sound'
    }
];

const MODE_TYPES = {
    CONSONANTS: 'consonants',
    VOWELS: 'vowels',
    BOTH: 'both'
};

export default function HangeulPractice() {
    const { t } = useLanguage();
    
    const [currentMode, setCurrentMode] = useState(MODE_TYPES.BOTH);
    const [currentCard, setCurrentCard] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [score, setScore] = useState({ correct: 0, incorrect: 0 });
    
    // Get current character set based on mode
    const getCurrentCharacterSet = useCallback(() => {
        switch (currentMode) {
            case MODE_TYPES.CONSONANTS:
                return CONSONANTS;
            case MODE_TYPES.VOWELS:
                return VOWELS;
            case MODE_TYPES.BOTH:
                return [...CONSONANTS, ...VOWELS];
            default:
                return [...CONSONANTS, ...VOWELS];
        }
    }, [currentMode]);
    
    // Generate a new random character
    const generateNewCharacter = useCallback(() => {
        const characterSet = getCurrentCharacterSet();
        const randomIndex = Math.floor(Math.random() * characterSet.length);
        const newCard = characterSet[randomIndex];
        
        setCurrentCard(newCard);
        setIsExpanded(false);
    }, [getCurrentCharacterSet]);
    
    // Initialize with a random character and regenerate when mode changes
    useEffect(() => {
        generateNewCharacter();
        // Reset score when mode changes
        setScore({ correct: 0, incorrect: 0 });
    }, [generateNewCharacter, currentMode]);
    
    // Handle card expand
    const handleExpand = () => {
        if (!isExpanded) {
            setIsExpanded(true);
            if (audioEnabled && currentCard) {
                playAudio(currentCard.character);
            }
        }
    };
    
    // Handle next character
    const handleNext = () => {
        generateNewCharacter();
    };
    
    // Handle answer selection
    const handleAnswer = (isCorrect) => {
        setScore(prev => ({
            correct: isCorrect ? prev.correct + 1 : prev.correct,
            incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1
        }));
        generateNewCharacter();
    };
    
    // Play audio for character
    const playAudio = async (character) => {
        // Complete character to syllable mapping for TTS:
        /*
        const audioMap = {
            // Basic consonants with 아 vowel for clear pronunciation
            'ㄱ': '가', 'ㄴ': '나', 'ㄷ': '다', 'ㄹ': '라', 'ㅁ': '마', 'ㅂ': '바', 
            'ㅅ': '사', 'ㅇ': '아', 'ㅈ': '자', 'ㅊ': '차', 'ㅋ': '카', 'ㅌ': '타', 
            'ㅍ': '파', 'ㅎ': '하',
            // Aspirated/tense consonants
            'ㄲ': '까', 'ㄸ': '따', 'ㅃ': '빠', 'ㅆ': '싸', 'ㅉ': '짜',
            // Basic vowels with silent ㅇ consonant
            'ㅏ': '아', 'ㅓ': '어', 'ㅗ': '오', 'ㅜ': '우', 'ㅡ': '으', 'ㅣ': '이',
            'ㅑ': '야', 'ㅕ': '여', 'ㅛ': '요', 'ㅠ': '유', 'ㅐ': '애', 'ㅔ': '에',
            // W- combination vowels
            'ㅘ': '와', 'ㅙ': '왜', 'ㅚ': '외', 'ㅝ': '워', 'ㅞ': '웨', 'ㅟ': '위', 'ㅢ': '의'
        };
        */
        return;
    };
    
    // Handle keyboard events
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                if (!isExpanded) {
                    handleExpand();
                }
            } else if (isExpanded) {
                if (event.code === 'KeyD') {
                    event.preventDefault();
                    handleAnswer(true);
                } else if (event.code === 'KeyF') {
                    event.preventDefault();
                    handleAnswer(false);
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isExpanded]);
    
    // Handle mode change
    const handleModeChange = (mode) => {
        setCurrentMode(mode);
        // Character will be regenerated automatically by useEffect
    };
    
    useEffect(() => {
        document.title = 'Hanbok - Learn Hangeul';
    }, []);
    
    if (!currentCard) {
        return <div className={styles.loading}>Loading...</div>;
    }
    
    return (
        <Dashboard>
            <div className={styles.hangeulContainer}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Learn Hangeul</h1>
                    <p className={styles.subtitle}>Master the Korean alphabet with interactive flashcards</p>
                </div>
                
                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.modeSelector}>
                        <label className={styles.controlLabel}>Practice Mode:</label>
                        <div className={styles.modeButtons}>
                            {Object.entries(MODE_TYPES).map(([key, value]) => (
                                <button
                                    key={value}
                                    className={`${styles.modeButton} ${currentMode === value ? styles.active : ''}`}
                                    onClick={() => handleModeChange(value)}
                                >
                                    {key.charAt(0) + key.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Score Counter */}
                <div className={styles.counter}>
                    <div className={`${styles.counterItem} ${styles.correct}`}>
                        <MaterialSymbolsCheckCircleOutlineRounded className={styles.counterIcon} />
                        <span>{score.correct}</span>
                    </div>
                    <div className={`${styles.counterItem} ${styles.incorrect}`}>
                        <MaterialSymbolsCancel className={styles.counterIcon} />
                        <span>{score.incorrect}</span>
                    </div>
                </div>
                
                {/* Flashcard */}
                <div className={styles.flashcardContainer}>
                    <div 
                        className={`${styles.flashcard} ${isExpanded ? styles.expanded : ''}`}
                        onClick={!isExpanded ? handleExpand : undefined}
                        style={{ cursor: !isExpanded ? 'pointer' : 'default' }}
                    >
                        <div className={styles.cardContent}>
                            <div className={styles.characterSection}>
                                <div className={styles.character}>
                                    {currentCard.character}
                                </div>
                                {!isExpanded && (
                                    <div className={styles.instruction}>
                                        Press SPACE to reveal
                                    </div>
                                )}
                            </div>
                            
                            {isExpanded && (
                                <div className={styles.expandedContent}>
                                    <div className={styles.characterInfo}>
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Name:</span>
                                            <span className={styles.value}>{currentCard.name}</span>
                                        </div>
                                        
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Sound:</span>
                                            <span className={styles.value}>"{currentCard.sound}"</span>
                                        </div>
                                        
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Keyword:</span>
                                            <span className={styles.value}>{currentCard.keyword}</span>
                                        </div>
                                        
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Memory Tip:</span>
                                            <span className={styles.value}>{currentCard.tip}</span>
                                        </div>
                                        
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Example:</span>
                                            <span className={styles.value}>{currentCard.example}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Answer Buttons */}
                                    <div className={styles.answerButtons}>
                                        <button
                                            className={`${styles.answerButton} ${styles.correct}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAnswer(true);
                                            }}
                                        >
                                            <MaterialSymbolsCheckCircleOutlineRounded style={{ fontSize: '16px' }} />
                                            Right <span className={styles.key}>D</span>
                                        </button>
                                        <button
                                            className={`${styles.answerButton} ${styles.incorrect}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAnswer(false);
                                            }}
                                        >
                                            <MaterialSymbolsCancel style={{ fontSize: '16px' }} />
                                            Wrong <span className={styles.key}>F</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Action button */}
                {!isExpanded && (
                    <div className={styles.actionButtons}>
                        <button 
                            className={styles.actionButton}
                            onClick={handleExpand}
                        >
                            Reveal <span className={styles.spaceKey}>Space</span>
                        </button>
                    </div>
                )}
                
                {/* Progress info */}
                <div className={styles.progress}>
                    <div className={styles.progressInfo}>
                        Learning {currentMode} • {getCurrentCharacterSet().length} characters available
                    </div>
                </div>
                
                {/* Hanbok Girl Image */}
                <Image
                    src="/images/hanbokgirl.png"
                    alt="Hanbok Girl"
                    width={128}
                    height={192}
                    className={styles.hanbokGirl}
                />
            </div>
        </Dashboard>
    );
} 