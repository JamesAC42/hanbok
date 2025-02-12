'use client';
import { useState, useEffect } from 'react';

import { MaterialSymbolsPlayArrowRounded } from '@/components/icons/Play';
import { MaterialSymbolsPause } from '@/components/icons/Pause';
import Image from 'next/image';

import styles from '@/styles/components/sentenceanalyzer/audioplayer.module.scss';

const AudioPlayer = ({ voice1, voice2 }) => {

    const [activeSpeaker, setActiveSpeaker] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);

    const [audioRefs] = useState({
      voice1: typeof Audio !== 'undefined' ? new Audio() : null,
      voice2: typeof Audio !== 'undefined' ? new Audio() : null
    });

    const handlePlayPause = () => {
        const activeAudio = activeSpeaker === 1 ? audioRefs.voice1 : audioRefs.voice2;
        const inactiveAudio = activeSpeaker === 1 ? audioRefs.voice2 : audioRefs.voice1;
    
        if (isPlaying) {
            activeAudio?.pause();
            setIsPlaying(false);
        } else {
            inactiveAudio?.pause();
            if (activeAudio) {
                activeAudio.play().catch(error => {
                console.error('Error playing audio:', error);
                });
                setIsPlaying(true);
            }
        }
      };
    
      const handleSpeakerSwitch = () => {
            audioRefs.voice1?.pause();
            audioRefs.voice2?.pause();
            setIsPlaying(false);
            setActiveSpeaker(activeSpeaker === 1 ? 2 : 1);
      };

      useEffect(() => {
        if (voice1) {
            audioRefs.voice1.src = `${voice1}`;
        }
        if (voice2) {
            audioRefs.voice2.src = `${voice2}`;
        }
      }, [voice1, voice2]);
    
      useEffect(() => {
        const handleAudioEnded = () => {
            setIsPlaying(false);
        };
    
        audioRefs.voice1?.addEventListener('ended', handleAudioEnded);
        audioRefs.voice2?.addEventListener('ended', handleAudioEnded);
    
        return () => {
            audioRefs.voice1?.removeEventListener('ended', handleAudioEnded);
            audioRefs.voice2?.removeEventListener('ended', handleAudioEnded);
        };

      }, []);

    if(!voice1 || !voice2) {
        return null;
    }

    return (
        <div className={styles.audioPlayerWrapper}>
        {voice1 && voice2 && (
          <>
          <div className={styles.audioPlayers}>
            <audio controls>
              <source src={`${voice1}`} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <audio controls>
              <source src={`${voice2}`} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
          <div className={styles.audioPlayerOuter}>
            <div
              onClick={handleSpeakerSwitch} 
              className={`${styles.speakersOuter} ${activeSpeaker === 1 ? styles.speaker1Active : styles.speaker2Active}`}>
              <div className={styles.speaker}>
                <div className={styles.speakerInner}>
                  <div className={styles.speakerImage}>
                    <Image src="/images/speakers/female.png" alt="girl" width={1920} height={1080} />
                  </div>
                </div>
              </div>
              <div className={styles.speaker}>
                <div className={styles.speakerInner}>
                  <div className={styles.speakerImage}>
                    <Image src="/images/speakers/male.png" alt="boy" width={1920} height={1080} />
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={styles.togglePlaying}
              onClick={handlePlayPause}
            >
              <div className={styles.togglePlayingInner}>
                {isPlaying ? <MaterialSymbolsPause /> : <MaterialSymbolsPlayArrowRounded />}
              </div>
            </div>
          </div>
          </>
        )}
        </div>
    )
}

export default AudioPlayer;