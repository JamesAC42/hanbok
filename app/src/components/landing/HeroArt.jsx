'use client';
import { useEffect, useState } from 'react';
import styles from '@/styles/pages/landing.module.scss';

// The watercolor behind the hero. ?art=<name> swaps in another painting so
// the candidates can be compared on staging; the default is set in the CSS.
const ART = {
    peaks: 'hero-peaks',
    peaks2: 'hero-peaks-2',
    pine: 'hero-pine',
    pine2: 'hero-pine-2',
    village: 'hero-village',
    village2: 'hero-village-2',
    old: 'hero-watercolor',
};

const HeroArt = () => {
    const [art, setArt] = useState(null);

    useEffect(() => {
        const name = new URLSearchParams(window.location.search).get('art');
        if (ART[name]) setArt(ART[name]);
    }, []);

    return (
        <div
            className={styles.heroArt}
            aria-hidden="true"
            style={art ? { backgroundImage: `url('/images/landing/${art}.webp')` } : undefined}
        />
    );
};

export default HeroArt;
