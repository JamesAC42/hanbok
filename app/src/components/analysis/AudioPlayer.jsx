'use client';
import { useState, useEffect } from 'react';

import { MaterialSymbolsPlayArrowRounded } from '@/components/icons/Play';
import { MaterialSymbolsPause } from '@/components/icons/Pause';
import {useSearchParams} from 'next/navigation';
import { MaterialSymbolsArrowCircleRightRounded } from '@/components/icons/RightArrow';
import { TdesignUserTalk1Filled } from '@/components/icons/Talk';
import { MaterialSymbolsCancel } from '@/components/icons/Close';
import Image from 'next/image';
import { SvgSpinnersRingResize } from '@/components/icons/RingSpin';
import { MaterialSymbolsTurtle } from '@/components/icons/Turtle';
import { LucideRabbit } from '@/components/icons/Rabbit';

import styles from '@/styles/components/sentenceanalyzer/audioplayer.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

const AudioPlayer = ({ sentenceId: propSentenceId, voice1, voice2, voice1Slow, voice2Slow, isLyric }) => {

    const { t } = useLanguage();
    const [activeSpeaker, setActiveSpeaker] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);

    const [loadingAudio, setLoadingAudio] = useState(false);
    const [loadingSlowAudio, setLoadingSlowAudio] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [voices, setVoices] = useState({});
    const [playbackMode, setPlaybackMode] = useState('normal');
    const [audioErrorCode, setAudioErrorCode] = useState(null);
    const [autoRequested, setAutoRequested] = useState(false);
    const searchParams = useSearchParams();

    const { user, decrementRemainingAudioGenerations } = useAuth();

    const [showPopup, setShowPopup] = useState(false);

    const [audioRefs] = useState({
      voice1: typeof Audio !== 'undefined' ? new Audio() : null,
      voice2: typeof Audio !== 'undefined' ? new Audio() : null
    });
    const sentenceId = propSentenceId || searchParams.get('id');

    useEffect(() => {
      setVoices(prev => ({
        ...prev,
        ...(voice1 !== undefined ? { voice1 } : {}),
        ...(voice2 !== undefined ? { voice2 } : {}),
        ...(voice1Slow !== undefined ? { voice1Slow } : {}),
        ...(voice2Slow !== undefined ? { voice2Slow } : {})
      }));
    }, [voice1, voice2, voice1Slow, voice2Slow]);

    useEffect(() => {
      setAudioErrorCode(null);
      setShowPopup(false);
      setAutoRequested(false);
    }, [sentenceId]);

    const isSlowMode = playbackMode === 'slow';
    const hasNormalAudio = !!(voices?.voice1 && voices?.voice2);
    const hasSlowAudio = !!(voices?.voice1Slow && voices?.voice2Slow);
    const hasActiveAudio = isSlowMode ? hasSlowAudio : hasNormalAudio;
    const isQuotaBlocked = audioErrorCode === 'AUDIO_QUOTA_EXCEEDED';

    const getActiveVoices = () => isSlowMode
      ? { voice1: voices.voice1Slow, voice2: voices.voice2Slow }
      : { voice1: voices.voice1, voice2: voices.voice2 };

    const handlePlayPause = () => {
      if (isSlowMode && loadingSlowAudio) {
        return;
      }

      if (isSlowMode && !hasSlowAudio) {
        refreshAudioUrls('slow');
        return;
      }

      if (!hasActiveAudio) {
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
          activeAudio.play()
            .catch(error => {
              
              // Check if the error is due to an expired URL (NotSupportedError or network error)
              if (error.name === 'NotSupportedError' || error.name === 'NetworkError') {
                refreshAudioUrls(playbackMode);
              }
            });
          setIsPlaying(true);
        }
      }
    };

    const refreshAudioUrls = (variant = playbackMode) => {
      const id = sentenceId;
      const isSlowRequest = variant === 'slow';
      if (!id || isRefreshing || loadingAudio || loadingSlowAudio) return;
      
      setIsRefreshing(true);
      if (isSlowRequest) {
        setLoadingSlowAudio(true);
      } else {
        setLoadingAudio(true);
      }
      
      console.log('Refreshing audio URLs for sentence:', id, 'variant:', variant);
      
      fetch(`/api/audio-url/${id}${isSlowRequest ? '?variant=slow' : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.voice1 && data.voice2) {
          // We got fresh URLs, update them
          console.log('Received fresh audio URLs');
          setVoices(prev => ({
            ...prev,
            ...(isSlowRequest ? {
              voice1Slow: data.voice1,
              voice2Slow: data.voice2
            } : {
              voice1: data.voice1,
              voice2: data.voice2
            })
          }));
          
          // Don't automatically play after refreshing URLs
          setIsPlaying(false);
        } else {
          // If we didn't get valid URLs, the S3 objects might be missing
          console.log('No valid URLs returned, keys have been cleared on the server');
          setIsPlaying(false);
        }
      })
      .catch(() => {
        setIsPlaying(false);
      })
      .finally(() => {
        if (isSlowRequest) {
          setLoadingSlowAudio(false);
        } else {
          setLoadingAudio(false);
        }
        // Reset the refreshing flag after a delay to prevent rapid consecutive calls
        setTimeout(() => {
          setIsRefreshing(false);
        }, 2000);
      });
    };
  
    const shouldLock = () => {
      return !hasNormalAudio || isQuotaBlocked || loadingAudio;
    }

    const handleSpeakerSwitch = () => {
      if (isSlowMode && loadingSlowAudio) {
        return;
      }

      if (!hasActiveAudio) {
        if (isSlowMode && hasNormalAudio && !hasSlowAudio) {
          refreshAudioUrls('slow');
        }
        return;
      }
      audioRefs.voice1?.pause();
      audioRefs.voice2?.pause();
      setIsPlaying(false);
      setActiveSpeaker(activeSpeaker === 1 ? 2 : 1);
    };

    const generateAudio = async () => {
      if (!sentenceId || loadingAudio) {
        return;
      }

      setAudioErrorCode(null);
      setShowPopup(false);
      setLoadingAudio(true);  
      try {
        const response = await fetch(`/api/sentences/${sentenceId}/generate-audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setVoices({
            voice1: data.voice1, 
            voice2: data.voice2,
            voice1Slow: data.voice1Slow,
            voice2Slow: data.voice2Slow
          });

          if(user && (user.tier === 0 || user.tier === 1)) {
            decrementRemainingAudioGenerations();
          }
          return true;
        }

        if (data.code === 'AUDIO_QUOTA_EXCEEDED') {
          setAudioErrorCode(data.code);
          setShowPopup(true);
        } else {
          setAudioErrorCode('GENERATION_FAILED');
        }
        return false;
      } catch (error) {
        console.error('Error generating audio', error);
        setAudioErrorCode('GENERATION_FAILED');
        return false;
      } finally {
        setLoadingAudio(false);
      }
    }

    useEffect(() => {
      if (!sentenceId || hasNormalAudio || loadingAudio || autoRequested || (voice1 && voice2)) {
        return;
      }
      setAutoRequested(true);
      generateAudio();
    }, [sentenceId, hasNormalAudio, loadingAudio, autoRequested, voice1, voice2]);
    
    const handleAudioLock = () => {
      if(loadingAudio || loadingSlowAudio) {
        return;
      }

      if (isQuotaBlocked) {
        setShowPopup(true);
        return;
      }

      generateAudio();
    }

    const hidePopup = () => {
      setShowPopup(false);
    }

    const togglePlaybackMode = () => {
      if (shouldLock()) {
        handleAudioLock();
        return;
      }

      audioRefs.voice1?.pause();
      audioRefs.voice2?.pause();
      setIsPlaying(false);

      if (isSlowMode) {
        setPlaybackMode('normal');
      } else {
        setPlaybackMode('slow');
        if (hasNormalAudio && !hasSlowAudio) {
          refreshAudioUrls('slow');
        }
      }
    };

    useEffect(() => {
      audioRefs.voice1?.pause();
      audioRefs.voice2?.pause();
      setIsPlaying(false);
    }, [playbackMode]);

    useEffect(() => {
      const activeVoices = getActiveVoices();
      if (activeVoices.voice1) {
        audioRefs.voice1.src = `${activeVoices.voice1}`;
        
        // Add error event listener to detect expired URLs when loading
        audioRefs.voice1.onerror = () => {
          if (!isRefreshing && !loadingAudio && !loadingSlowAudio) {
            refreshAudioUrls(playbackMode);
          }
        };
      }
      if (activeVoices.voice2) {
        audioRefs.voice2.src = `${activeVoices.voice2}`;
        
        // Add error event listener to detect expired URLs when loading
        audioRefs.voice2.onerror = () => {
          if (!isRefreshing && !loadingAudio && !loadingSlowAudio) {
            refreshAudioUrls(playbackMode);
          }
        };
      }
    }, [voices, playbackMode, loadingAudio, loadingSlowAudio, isRefreshing]);
  
    useEffect(() => {
      const handleAudioEnded = () => {
        setIsPlaying(false);
      };
  
      audioRefs.voice1?.addEventListener('ended', handleAudioEnded);
      audioRefs.voice2?.addEventListener('ended', handleAudioEnded);
  
      return () => {
        audioRefs.voice1?.removeEventListener('ended', handleAudioEnded);
        audioRefs.voice2?.removeEventListener('ended', handleAudioEnded);
        
        // Remove error event listeners
        if (audioRefs.voice1) audioRefs.voice1.onerror = null;
        if (audioRefs.voice2) audioRefs.voice2.onerror = null;
      };
    }, []);

    const previewVoices = getActiveVoices();

    return (
        <div className={styles.audioPlayerWrapper}>
          <div className={styles.audioPlayers}>
            <audio controls>
              {previewVoices?.voice1 && (
                <source src={previewVoices.voice1} type="audio/mpeg" />
              )}
              Your browser does not support the audio element.
            </audio>
            <audio controls>
              {previewVoices?.voice2 && (
                <source src={previewVoices.voice2} type="audio/mpeg" />
              )}
              Your browser does not support the audio element.
            </audio>
          </div>
          <div className={`${styles.audioPlayerOuter} ${shouldLock() ? styles.locked : ''}`}>

            <button
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
                    <Image 
                      src="/images/speakers/female.png" 
                      alt={t('audioPlayer.speakerImages.female')} 
                      width={1920} 
                      height={1080} 
                    />
                  </div>
                </div>
              </div>
              <div className={styles.speaker}>
                <div className={styles.speakerInner}>
                  <div className={styles.speakerImage}>
                    <Image 
                      src="/images/speakers/male.png" 
                      alt={t('audioPlayer.speakerImages.male')} 
                      width={1920} 
                      height={1080} 
                    />
                  </div>
                </div>
              </div>
            </button>

            <div className={styles.playbackColumn}>
              <button 
                className={`${
                  styles.togglePlaying
                } ${
                  shouldLock() ? styles.locked : ''
                }`}
                onClick={handlePlayPause}
                disabled={(shouldLock() && !isSlowMode) || (isSlowMode && loadingSlowAudio)}
              >
                <div className={styles.togglePlayingInner}>
                  {isPlaying ? <MaterialSymbolsPause /> : <MaterialSymbolsPlayArrowRounded />}
                </div>
              </button>
              <button
                className={`${
                  styles.speedToggle
                } ${
                  isSlowMode ? styles.active : ''
                } ${
                  shouldLock() ? styles.locked : ''
                }`}
                onClick={togglePlaybackMode}
                disabled={shouldLock() || loadingSlowAudio}
              >
                <div className={styles.speedToggleInner}>
                  {isSlowMode
                    ? (loadingSlowAudio ? <SvgSpinnersRingResize /> : <MaterialSymbolsTurtle />)
                    : <LucideRabbit />}
                  <span>{isSlowMode ? '0.7x' : '1x'}</span>
                </div>
              </button>
            </div>
          </div>
          
          {
            (shouldLock()) && (
              <div
                onClick={() => handleAudioLock()}
                className={styles.audioPlayerLocked}>
                  <div className={styles.generateAudioButton}>
                    {loadingAudio ? <SvgSpinnersRingResize /> : <TdesignUserTalk1Filled />}
                    <div className={styles.generateAudioButtonText}>
                      {
                        isQuotaBlocked
                          ? t('audioPlayer.noCredits.title')
                          : (loadingAudio ? t('audioPlayer.generating') : t('audioPlayer.playAudio'))
                      }
                    </div>
                  </div>
              </div>
            )
          }

          {
            showPopup && (
              <div className={styles.audioPlayerLockedPopup}>
                <p>{t('audioPlayer.noCredits.title')}</p>
                <Link href="/pricing">
                  {t('audioPlayer.noCredits.cta')} <MaterialSymbolsArrowCircleRightRounded />
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
