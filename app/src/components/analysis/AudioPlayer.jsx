'use client';
import { useState, useEffect } from 'react';

import { MaterialSymbolsPlayArrowRounded } from '@/components/icons/Play';
import { MaterialSymbolsPause } from '@/components/icons/Pause';
import {useSearchParams} from 'next/navigation';
import { MaterialSymbolsLockOpenCircle } from '@/components/icons/Lock';
import { MaterialSymbolsArrowCircleRightRounded } from '@/components/icons/RightArrow';
import { TdesignUserTalk1Filled } from '@/components/icons/Talk';
import { MaterialSymbolsCancel } from '@/components/icons/Close';
import Image from 'next/image';
import { SvgSpinnersRingResize } from '@/components/icons/RingSpin';

import styles from '@/styles/components/sentenceanalyzer/audioplayer.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const AudioPlayer = ({ sentenceId: propSentenceId, voice1, voice2 }) => {

    const [activeSpeaker, setActiveSpeaker] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);

    const [loadingAudio, setLoadingAudio] = useState(false);

    const [voices, setVoices] = useState({});
    const searchParams = useSearchParams();

    useEffect(() => {
      if(voice1 || voice2) {
        setVoices({voice1: voice1, voice2: voice2});
      }
    }, [voice1, voice2]);
      
    const { user, decrementRemainingAudioGenerations } = useAuth();

    const [showPopup, setShowPopup] = useState(false);

    const [audioRefs] = useState({
      voice1: typeof Audio !== 'undefined' ? new Audio() : null,
      voice2: typeof Audio !== 'undefined' ? new Audio() : null
    });

    const getSentenceId = () => {
        // First check prop sentenceId, then fall back to query param
        return propSentenceId || searchParams.get('id');
    };

    const handlePlayPause = () => {

      if (noAudio()) {
        return;
      }

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

    const noAudio = () => (voices?.voice1 == null || voices?.voice2 == null);
  
    const hasRemainingAudioGenerations = () => {
      if(!user) {
        return false;
      }
      return user.remainingAudioGenerations > 0;
    }

    const loggedIn = () => {
      return !!user;
    }

    const shouldLock = () => {
      return !loggedIn || noAudio()
    }

    const handleSpeakerSwitch = () => {
      if (noAudio()) {
        return;
      }
      audioRefs.voice1?.pause();
      audioRefs.voice2?.pause();
      setIsPlaying(false);
      setActiveSpeaker(activeSpeaker === 1 ? 2 : 1);
    };

    const generateAudio = () => {
      if(!loggedIn() || !hasRemainingAudioGenerations()) {
        setShowPopup(true);
        return;
      }
      const id = getSentenceId();
      setLoadingAudio(true);  
      fetch(`/api/sentences/${id}/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setVoices({voice1: data.voice1, voice2: data.voice2});
          decrementRemainingAudioGenerations();
        } else {
          console.error('Error generating audio:', data.error);
        }
      })
      .catch(error => {
        console.error('Error generating audio:', error);
      })
      .finally(() => {
        setLoadingAudio(false);
      });
    }
    
    const handleAudioLock = () => {
      if(loadingAudio) {
        return;
      }
      if(loggedIn() && hasRemainingAudioGenerations()) {
        setShowPopup(false);
        generateAudio();
      } else if(!loggedIn()) {
        setShowPopup(true);
      } else if(loggedIn() && !hasRemainingAudioGenerations()) {
        setShowPopup(true);
      }
    }

    const hidePopup = () => {
      setShowPopup(false);
    }

    useEffect(() => {
      if (voices.voice1) {
          audioRefs.voice1.src = `${voices.voice1}`;
      }
      if (voices.voice2) {
          audioRefs.voice2.src = `${voices.voice2}`;
      }
    }, [voices]);
  
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

    return (
        <div className={styles.audioPlayerWrapper}>
          <div className={styles.audioPlayers}>
            <audio controls>
              <source src={`${voices?.voice1}`} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <audio controls>
              <source src={`${voices?.voice2}`} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
          <div className={`${styles.audioPlayerOuter} ${shouldLock() ? styles.locked : ''}`}>

            <div
              onClick={handleSpeakerSwitch} 
              className={`${
                styles.speakersOuter
                } ${
                  activeSpeaker === 1 ? styles.speaker1Active : styles.speaker2Active
                } ${
                  shouldLock() ? styles.locked : ''
                }`}>
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
              className={`${
                styles.togglePlaying
              } ${
                shouldLock() ? styles.locked : ''
              }`}
              onClick={handlePlayPause}>
              <div className={styles.togglePlayingInner}>
                {isPlaying ? <MaterialSymbolsPause /> : <MaterialSymbolsPlayArrowRounded />}
              </div>
            </div>
          </div>
          
          {
            (shouldLock()) && (
              <div
                onClick={() => handleAudioLock()}
                className={styles.audioPlayerLocked}>
                  {
                    user ? (
                      <>
                      {
                        !loadingAudio ? (
                          <div className={styles.generateAudioButton}>
                            <TdesignUserTalk1Filled />
                            <div className={styles.generateAudioButtonText}>
                            Play Audio
                            </div>
                          </div>
                        ) : (
                          <div className={styles.generateAudioButton}>
                            <SvgSpinnersRingResize />
                            <div className={styles.generateAudioButtonText}>
                              Generating...
                            </div>
                          </div>
                        )
                      }
                      </>
                    ) : (
                      <MaterialSymbolsLockOpenCircle />
                    )
                  }
              </div>
            )
          }

          {
            (showPopup && !loggedIn()) && (
              <div className={styles.audioPlayerLockedPopup}>
                <p>Sign in to generate audio samples and hear the sentence spoken by a native speaker.</p>
                <Link href="/login">
                  Make a free account <MaterialSymbolsArrowCircleRightRounded />
                </Link>

                <div className={styles.closePopup} onClick={hidePopup}>
                  <MaterialSymbolsCancel />
                </div>
              </div>
            )
          }

          {
            (showPopup && loggedIn()) && (
              <div className={styles.audioPlayerLockedPopup}>
                <p>You have no remaining audio credits.</p>
                <Link href="/pricing">
                  Get More <MaterialSymbolsArrowCircleRightRounded />
                </Link>

                <div className={styles.closePopup} onClick={hidePopup}>
                  <MaterialSymbolsCancel />
                </div>
              </div>
            )
          }
        </div>
    )
}

export default AudioPlayer;