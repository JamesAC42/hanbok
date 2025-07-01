import styles from '@/styles/components/typing/modeselector.module.scss';

export default function ModeSelector({ 
    currentMode, 
    onModeChange, 
    currentRow, 
    onRowChange, 
    onNewParagraph, 
    modes,
    onShowIMEModal
}) {
    const handleModeChange = (mode) => {
        // Check if switching to paragraph mode and if user hasn't seen IME explanation
        if (mode === modes.PARAGRAPH && !localStorage.getItem('hanbok_ime_explained')) {
            onShowIMEModal(mode);
        } else {
            onModeChange(mode);
        }
    };
    
    const getModeTitle = (mode) => {
        switch (mode) {
            case modes.ROW_DRILL:
                return 'Row Drilling';
            case modes.ALL_ROWS:
                return 'All Characters';
            case modes.PARAGRAPH:
                return 'Paragraph Practice';
            default:
                return mode;
        }
    };
    
    const getModeDescription = (mode) => {
        switch (mode) {
            case modes.ROW_DRILL:
                return 'Practice characters from a specific keyboard row (includes aspirated characters with Shift)';
            case modes.ALL_ROWS:
                return 'Practice random characters from all keyboard rows (includes aspirated characters)';
            case modes.PARAGRAPH:
                return 'Practice typing complete Korean paragraphs';
            default:
                return '';
        }
    };
    
    return (
        <div className={styles.modeSelector}>
            <h2 className={styles.title}>Practice Mode</h2>
            
            <div className={styles.modes}>
                {Object.values(modes).map((mode) => (
                    <div
                        key={mode}
                        className={`${styles.modeCard} ${currentMode === mode ? styles.active : ''}`}
                        onClick={() => handleModeChange(mode)}
                    >
                        <div className={styles.modeHeader}>
                            <h3 className={styles.modeTitle}>{getModeTitle(mode)}</h3>
                            <div className={`${styles.modeIcon} ${currentMode === mode ? styles.active : ''}`}>
                                {currentMode === mode ? '●' : '○'}
                            </div>
                        </div>
                        <p className={styles.modeDescription}>
                            {getModeDescription(mode)}
                        </p>
                    </div>
                ))}
            </div>
            
            {/* Row selector for row drill mode */}
            {currentMode === modes.ROW_DRILL && (
                <div className={styles.rowSelector}>
                    <h3 className={styles.rowTitle}>Select Keyboard Row</h3>
                    <div className={styles.rowButtons}>
                        {[1, 2, 3].map((row) => (
                            <button
                                key={row}
                                className={`${styles.rowButton} ${currentRow === row ? styles.active : ''}`}
                                onClick={() => onRowChange(row)}
                            >
                                Row {row}
                            </button>
                        ))}
                    </div>
                    <div className={styles.rowInfo}>
                        {currentRow === 1 && (
                            <p>Row 1: ㅂ ㅃ ㅈ ㅉ ㄷ ㄸ ㄱ ㄲ ㅅ ㅆ ㅛ ㅕ ㅑ ㅐ ㅒ ㅔ ㅖ</p>
                        )}
                        {currentRow === 2 && (
                            <p>Row 2: ㅁ ㄴ ㅇ ㄹ ㅎ ㅗ ㅓ ㅏ ㅣ</p>
                        )}
                        {currentRow === 3 && (
                            <p>Row 3: ㅋ ㅌ ㅊ ㅍ ㅠ ㅜ ㅡ</p>
                        )}
                    </div>
                </div>
            )}
            
            {/* New paragraph button for paragraph mode */}
            {currentMode === modes.PARAGRAPH && (
                <div className={styles.paragraphControls}>
                    <button
                        className={styles.newParagraphButton}
                        onClick={onNewParagraph}
                    >
                        New Paragraph
                    </button>
                    <p className={styles.paragraphHint}>
                        Complete the current paragraph or click "New Paragraph" for a different text.
                    </p>
                </div>
            )}
            
        </div>
    );
} 