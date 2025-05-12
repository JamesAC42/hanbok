import React from 'react';
import styles from './TestimonialCards.module.scss';
import { MaterialSymbolsLightKidStar } from './icons/StarFilled';

export default function TestimonialCard({ quote, author, stars = 5 }) {
  return (
    <div className={styles.testimonialCard}>  
      <div className={styles.stars}>
        {[...Array(stars)].map((_, i) => (
          <MaterialSymbolsLightKidStar key={i} className={styles.starIcon} />
        ))}
      </div>
      <p className={styles.quote}>“{quote}”</p>
      <p className={styles.author}>— {author}</p>
    </div>
  );
}