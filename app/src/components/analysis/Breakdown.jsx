'use client';
import { useState, useEffect } from 'react';
import styles from '@/styles/components/sentenceanalyzer/breakdown.module.scss';
import renderPronunciation from '@/lib/pronunciation';
import getFontClass from '@/lib/fontClass';

const Breakdown = ({ 
	analysis,
	language,
	setWordInfo,
	resetLockedWord,
	shouldAnimate,
	showPronunciation
}) => {

	const [lockedWord, setLockedWord] = useState(null);

	useEffect(() => {
		if (resetLockedWord) {
			setLockedWord(null);
		}
	}, [resetLockedWord]);

	const handleWordInfoLeave = () => {
		if (!lockedWord) {
		setWordInfo(null);
		}
	};

	const handleWordInfoEnter = (item, isParticle = false) => {
		if (!lockedWord || (lockedWord && lockedWord.dictionary_form === item.dictionary_form)) {
			setWordInfo({...item, type: isParticle ? 'particle' : item.type, isParticle});
		}
	}

	const handleWordClick = (item, isParticle = false) => {
		if (item.type === "punctuation") {
			return;
		}
		if (lockedWord && lockedWord.dictionary_form === item.dictionary_form) {
			setLockedWord(null);
			setWordInfo(null);
		} else {
			setLockedWord(item);
			setWordInfo({...item, type: isParticle ? 'particle' : item.type, isParticle});
		}
	}
  
	const renderParticles = (item) => {
		if(language === "zh" || language === "ja" || language === "ko") return null;
		return item.grammar?.particles?.map((particle, index) => (
			<div 
				key={index}
				className={`${styles.sentenceItem} ${
					lockedWord && lockedWord.particle === particle.particle ? styles.locked : ""
				}`}
				data-role="particle"
				onMouseEnter={() => handleWordInfoEnter(particle, true)}
				onClick={() => handleWordClick(particle, true)}
				>
				{particle.particle}
			</div>
		));
	}
	
	const getCleanedType = (wordType) => {
		if (!wordType) {
			return '';
		}
		return wordType.replaceAll(' ', '_').toLowerCase();
	}

	const hasPronunciation = () => {
		if(language === "zh" || language === "ja" || language === "ko" || language === "ru") return styles.hasPronunciation;
		return "";
	}

	if (!analysis) {
		return null;
	}

	return (
		
		<div className={styles.breakdown}>
		<div
		className={`${styles.breakdownContent} ${hasPronunciation()}`}
		onMouseLeave={() => handleWordInfoLeave()}
		>

		{analysis.components.map((item, index) => {
			const isWhitespace = item.text.trim() === "";
			return (
			<div
				key={item.text + ": " + index}
				className={styles.sentenceItemContainer}
				onMouseLeave={() => handleWordInfoLeave()}
			>
				{showPronunciation && (
					<div className={styles.pronunciation}>
						{
							renderPronunciation(item, language)
						}
					</div>
				)}
				<button
				className={`${styles.sentenceItem} ${
					isWhitespace ? styles.whitespace : ""
				} ${
					lockedWord &&
					lockedWord.dictionary_form === item.dictionary_form
					? styles.locked
					: ""
				} ${
					getFontClass(language)
				}`}
				data-role={getCleanedType(item.type)}
				onMouseEnter={() => handleWordInfoEnter(item)}
				onClick={() => handleWordClick(item)}
				// TODO: Translate this aria-label into other supported languages
				aria-label={`Show details for ${item.text}`}
				>
				{item.text}
				</button>
				{item.grammar?.particles?.length > 0 && renderParticles(item)}
			</div>
			);
		})}
		</div>
		</div>
	);
};

export default Breakdown;
