'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import adminLyricsStyles from '@/styles/components/adminlyrics.module.scss';
import { MaterialSymbolsLibraryAddRounded } from '@/components/icons/Add';
import { MaterialSymbolsCheckCircleOutlineRounded } from '@/components/icons/CheckCircle';
import { MaterialSymbolsPublishRounded } from '@/components/icons/Publish';
import { MaterialSymbolsBackspace } from '@/components/icons/Exit';
import { IcSharpPreview } from '@/components/icons/Preview';
import { MaterialSymbolsDeleteOutlineSharp } from '@/components/icons/Delete';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminLyrics = () => {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const [lyrics, setLyrics] = useState([]);
    const { t } = useLanguage();
    const [selectedLyric, setSelectedLyric] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loadingLyrics, setLoadingLyrics] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        anime: '',
        genre: '',
        youtubeUrl: '',
        lyricsText: '',
        language: 'ko',
        published: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
    const [analysisLog, setAnalysisLog] = useState([]);

    const [message, setMessage] = useState('');
    
    // Create ref for terminal content to enable auto-scrolling
    const terminalContentRef = useRef(null);

    // Auto-scroll terminal when new logs are added
    useEffect(() => {
        if (terminalContentRef.current && analysisLog.length > 0) {
            const terminal = terminalContentRef.current;
            terminal.scrollTop = terminal.scrollHeight;
        }
    }, [analysisLog]);

    useEffect(() => {
        document.title = t('lyrics.adminPageTitle');
    }, []);

    // Check if user is authenticated and is admin
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/');
        }
    }, [isAuthenticated, loading, router]);

    // Fetch all lyrics
    useEffect(() => {
        const fetchLyrics = async () => {
            try {
                setLoadingLyrics(true);
                const response = await fetch('/api/lyrics/admin', {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                
                if (data.success) {
                    setLyrics(data.lyrics);
                } else {
                    setError(data.message || 'Failed to fetch lyrics');
                }
            } catch (err) {
                setError('An error occurred while fetching lyrics');
                console.error(err);
            } finally {
                setLoadingLyrics(false);
            }
        };


        if (isAuthenticated) {
            fetchLyrics();
        }

    }, [isAuthenticated]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle song selection
    const handleSelectSong = (lyric) => {
        setSelectedLyric(lyric);
        setIsCreating(false);
        setFormData({
            title: lyric.title,
            artist: lyric.artist || '',
            anime: lyric.anime || '',
            genre: lyric.genre,
            youtubeUrl: lyric.youtubeUrl || '',
            lyricsText: lyric.lyricsText,
            language: lyric.language,
            published: lyric.published
        });
    };

    // Handle create new song button
    const handleCreateNew = () => {
        setSelectedLyric(null);
        setIsCreating(true);
        setFormData({
            title: '',
            artist: '',
            anime: '',
            genre: '',
            youtubeUrl: '',
            lyricsText: '',
            language: 'ko',
            published: false
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            const url = isCreating 
                ? '/api/lyrics/admin' 
                : `/api/lyrics/admin/${selectedLyric._id}`;
            
            const method = isCreating ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                setSubmitSuccess(true);
                
                // Refresh lyrics list
                const lyricsResponse = await fetch('/api/lyrics/admin', {
                    credentials: 'include'
                });
                const lyricsData = await lyricsResponse.json();
                
                if (lyricsData.success) {
                    setLyrics(lyricsData.lyrics);
                    
                    // If we just created a new song, select it
                    if (isCreating && data.lyric) {
                        const newLyric = lyricsData.lyrics.find(l => l._id === data.lyric._id);
                        if (newLyric) {
                            setSelectedLyric(newLyric);
                            setIsCreating(false);
                        }
                    }
                }
                
                // Reset form after successful submission
                setTimeout(() => {
                    setSubmitSuccess(false);
                }, 3000);
            } else {
                setSubmitError(data.message || 'Failed to save lyrics');
            }
        } catch (err) {
            setSubmitError('An error occurred while saving lyrics');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete song
    const handleDelete = async () => {
        if (!selectedLyric || !confirm('Are you sure you want to delete this song?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/lyrics/admin/${selectedLyric._id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Remove the deleted song from the list
                setLyrics(prev => prev.filter(l => l._id !== selectedLyric._id));
                setSelectedLyric(null);
                setIsCreating(false);
                setFormData({
                    title: '',
                    artist: '',
                    genre: '',
                    youtubeUrl: '',
                    lyricsText: '',
                    language: 'ko',
                    published: false
                });
            } else {
                setSubmitError(data.message || 'Failed to delete lyrics');
            }
        } catch (err) {
            setSubmitError('An error occurred while deleting lyrics');
            console.error(err);
        }
    };

    const handleGenerateAnalysis = async () => {
        if (!selectedLyric || !selectedLyric._id) {
            return;
        }
        
        setGeneratingAnalysis(true);
        setAnalysisLog([]);

        try {
            // Create EventSource connection with retry mechanism
            
            // Add connection message to log
            setAnalysisLog(prev => [...prev, { 
                type: 'info', 
                message: 'Connecting to server...', 
                timestamp: new Date() 
            }]);
            
            const eventSourceUrl = `/api/lyrics/admin/generate-analysis/${selectedLyric._id}`;
            const eventSource = new EventSource(eventSourceUrl, {
                withCredentials: true
            });

            // Define retry timeout value
            eventSource.onerror = (event) => {
                
                // Check if the connection is closed due to an error
                if (eventSource.readyState === EventSource.CLOSED) {
                    const errorMessage = 'Connection lost. The server may have disconnected or encountered an error.';
                    console.error(errorMessage);
                    
                    setAnalysisLog(prev => [...prev, { 
                        type: 'error', 
                        message: errorMessage, 
                        timestamp: new Date() 
                    }]);
                    
                    // Close the connection and reset state
                    eventSource.close();
                    setGeneratingAnalysis(false);
                } else if (eventSource.readyState === EventSource.CONNECTING) {
                    // We're trying to reconnect
                    setAnalysisLog(prev => [...prev, { 
                        type: 'info', 
                        message: 'Connection lost. Attempting to reconnect...', 
                        timestamp: new Date() 
                    }]);
                }
            };

            eventSource.onopen = () => {
                setAnalysisLog(prev => [...prev, { 
                    type: 'info', 
                    message: 'Connected to server. Starting analysis...', 
                    timestamp: new Date() 
                }]);
            };

            // Handle general message events
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setAnalysisLog(prev => [...prev, { 
                        type: 'info', 
                        message: data.message || 'Received update from server', 
                        timestamp: new Date() 
                    }]);
                } catch (err) {
                    console.error('Error parsing message event data:', err);
                    // Still show the raw message if parsing fails
                    setAnalysisLog(prev => [...prev, { 
                        type: 'info', 
                        message: String(event.data) || 'Received update from server', 
                        timestamp: new Date() 
                    }]);
                }
            };

            // Handle specific event types
            eventSource.addEventListener('status', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setAnalysisLog(prev => [...prev, { 
                        type: 'status', 
                        message: data.message, 
                        timestamp: new Date() 
                    }]);
                } catch (err) {
                    console.error('Error parsing status event data:', err);
                }
            });

            eventSource.addEventListener('progress', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setAnalysisLog(prev => [...prev, { 
                        type: 'progress', 
                        message: `Processing ${data.processed}/${data.total} segments (${Math.round(data.progress)}%)`,
                        progress: data.progress,
                        timestamp: new Date()
                    }]);
                } catch (err) {
                    console.error('Error parsing progress event data:', err);
                }
            });

            eventSource.addEventListener('error', (event) => {
                let errorMessage = 'An unexpected error occurred';
                
                try {
                    // Try to parse the error data if it exists
                    if (event.data) {
                        const data = JSON.parse(event.data);
                        errorMessage = data.message || errorMessage;
                    }
                } catch (err) {
                    console.error('Error parsing error event:', err);
                }

                setAnalysisLog(prev => [...prev, { 
                    type: 'error', 
                    message: errorMessage, 
                    timestamp: new Date() 
                }]);
                
                eventSource.close();
                setGeneratingAnalysis(false);
            });

            eventSource.addEventListener('complete', async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setAnalysisLog(prev => [...prev, { 
                        type: 'success', 
                        message: data.message || 'Analysis completed successfully', 
                        timestamp: new Date() 
                    }]);
                } catch (err) {
                    console.error('Error parsing complete event data:', err);
                    setAnalysisLog(prev => [...prev, { 
                        type: 'success', 
                        message: 'Analysis completed successfully', 
                        timestamp: new Date() 
                    }]);
                }
                
                eventSource.close();
                setGeneratingAnalysis(false);

                // Refresh the lyric list to show updated analysis status
                try {
                    const lyricsResponse = await fetch('/api/lyrics/admin', {
                        credentials: 'include'
                    });
                    
                    const lyricsData = await lyricsResponse.json();
                    
                    if (lyricsData.success) {
                        setLyrics(lyricsData.lyrics);
                        // Update the selected lyric with new data
                        const updatedLyric = lyricsData.lyrics.find(l => l._id === selectedLyric._id);
                        if (updatedLyric) {
                            setSelectedLyric(updatedLyric);
                        }
                    }
                } catch (refreshError) {
                    console.error('Error refreshing lyrics list:', refreshError);
                    setAnalysisLog(prev => [...prev, { 
                        type: 'error', 
                        message: 'Analysis completed but failed to refresh the song list', 
                        timestamp: new Date() 
                    }]);
                }
            });

            // Cleanup function to close EventSource connection
            return () => {
                if (eventSource) {
                    eventSource.close();
                }
            };

        } catch (err) {
            console.error('Error in handleGenerateAnalysis:', err);
            setAnalysisLog(prev => [...prev, { 
                type: 'error', 
                message: `Error generating analysis: ${err.message || 'Unknown error'}`, 
                timestamp: new Date() 
            }]);
            setGeneratingAnalysis(false);
        }
    };

    const [isDeleting, setIsDeleting] = useState(false);

    // Handle delete analysis
    const handleDeleteAnalysis = async () => {
        if (!selectedLyric || !selectedLyric._id) {
            return;
        }
        
        if (!confirm('Are you sure you want to delete the analysis for this song? This will permanently delete all sentence analysis data.')) {
            return;
        }
        
        try {
            setIsDeleting(true);
            setMessage('');
            
            const response = await fetch(`/api/lyrics/${selectedLyric._id}/analysis`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update the lyric in the list
                setLyrics(prev => 
                    prev.map(lyric => 
                        lyric._id === selectedLyric._id 
                        ? { ...lyric, hasAnalysis: false } 
                        : lyric
                    )
                );
                
                // Update the selected lyric
                setSelectedLyric(prev => ({ ...prev, hasAnalysis: false }));
                
                setMessage(`Analysis deleted successfully. ${data.deletedSentences} sentences were removed.`);
                
                // Clear message after 3 seconds
                setTimeout(() => {
                    setMessage('');
                }, 3000);
            } else {
                setMessage(`Error: ${data.message || 'Failed to delete analysis'}`);
            }
        } catch (err) {
            console.error('Error deleting analysis:', err);
            setMessage('An error occurred while deleting the analysis');
        } finally {
            setIsDeleting(false);
        }
    };

    // Don't render while loading auth or if not an admin
    if (loading || !isAuthenticated) {
        return null;
    }

    return (
        <div className={adminLyricsStyles.adminLyricsContainer}>
            <div className={adminLyricsStyles.sidebar}>

                <div className={adminLyricsStyles.sidebarHeader}>
                    <Link href="/lyrics">
                        <MaterialSymbolsBackspace /> Back
                    </Link>
                    <button 
                        className={adminLyricsStyles.addSongButton}
                        onClick={handleCreateNew}
                    >
                        <MaterialSymbolsLibraryAddRounded /> Add New Song
                    </button>
                </div>
                
                <div className={adminLyricsStyles.songList}>
                    {loadingLyrics ? (
                        <div className={adminLyricsStyles.loading}>Loading songs...</div>
                    ) : error ? (
                        <div className={adminLyricsStyles.error}>{error}</div>
                    ) : lyrics.length === 0 ? (
                        <div className={adminLyricsStyles.loading}>No songs found</div>
                    ) : (
                        lyrics.map(lyric => (
                            <div 
                                key={lyric._id}
                                className={`${adminLyricsStyles.songItem} ${selectedLyric?._id === lyric._id ? adminLyricsStyles.active : ''}`}
                                onClick={() => handleSelectSong(lyric)}
                            >
                                <div className={adminLyricsStyles.songTitle}>{lyric.title}</div>
                                <div className={adminLyricsStyles.songArtist}>{lyric.artist || 'Unknown Artist'}</div>
                                <div className={adminLyricsStyles.indicators}>
                                    {lyric.hasAnalysis && (
                                        <div className={`${adminLyricsStyles.indicator} ${adminLyricsStyles.hasAnalysis}`}>
                                            <MaterialSymbolsCheckCircleOutlineRounded /> Analysis
                                        </div>
                                    )}
                                    {lyric.published && (
                                        <div className={`${adminLyricsStyles.indicator} ${adminLyricsStyles.published}`}>
                                            <MaterialSymbolsPublishRounded /> Published
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            <div className={adminLyricsStyles.mainContent}>
                {isCreating || selectedLyric ? (
                    <>
                        <h2 className={adminLyricsStyles.formTitle}>
                            {isCreating ? 'Add New Song' : 'Edit Song'}
                        </h2>
                        
                        {submitError && (
                            <div className={adminLyricsStyles.error}>{submitError}</div>
                        )}
                        
                        {submitSuccess && (
                            <div style={{ 
                                background: '#4caf50', 
                                color: 'white', 
                                padding: '1rem', 
                                borderRadius: '0.5rem',
                                marginBottom: '1rem'
                            }}>
                                Song saved successfully!
                            </div>
                        )}
                        
                        {message && (
                            <div style={{ 
                                background: message.startsWith('Error') ? '#f44336' : '#4caf50', 
                                color: 'white', 
                                padding: '1rem', 
                                borderRadius: '0.5rem',
                                marginBottom: '1rem'
                            }}>
                                {message}
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit}>
                            <div className={adminLyricsStyles.formGroup}>
                                <label htmlFor="title">Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div className={adminLyricsStyles.formGroup}>
                                <label htmlFor="artist">Artist</label>
                                <input
                                    type="text"
                                    id="artist"
                                    name="artist"
                                    value={formData.artist}
                                    onChange={handleInputChange}
                                />
                            </div>
                            
                            <div className={adminLyricsStyles.formGroup}>
                                <label htmlFor="anime">Anime</label>
                                <input
                                    type="text"
                                    id="anime"
                                    name="anime"
                                    value={formData.anime}
                                    onChange={handleInputChange}
                                />
                            </div>
                            
                            <div className={adminLyricsStyles.formGroup}>
                                <label htmlFor="genre">Genre *</label>
                                <select
                                    id="genre"
                                    name="genre"
                                    value={formData.genre}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a genre</option>
                                    <option value="kpop">K-Pop</option>
                                    <option value="jpop">J-Pop</option>
                                    <option value="anime">Anime</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            
                            <div className={adminLyricsStyles.formGroup}>
                                <label htmlFor="youtubeUrl">YouTube Video ID</label>
                                <input
                                    type="text"
                                    id="youtubeUrl"
                                    name="youtubeUrl"
                                    value={formData.youtubeUrl}
                                    onChange={handleInputChange}
                                />
                            </div>
                            
                            <div className={adminLyricsStyles.formGroup}>
                                <label htmlFor="language">Language *</label>
                                <select
                                    id="language"
                                    name="language"
                                    value={formData.language}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="ko">Korean</option>
                                    <option value="ja">Japanese</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                            
                            <div className={adminLyricsStyles.formGroup}>
                                <label htmlFor="lyricsText">Lyrics Text *</label>
                                <textarea
                                    id="lyricsText"
                                    name="lyricsText"
                                    value={formData.lyricsText}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div className={adminLyricsStyles.publishToggle}>
                                <input
                                    type="checkbox"
                                    id="published"
                                    name="published"
                                    checked={formData.published}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="published">Published (visible to users)</label>
                            </div>
                            
                            <div className={adminLyricsStyles.formActions}>
                                <button 
                                    type="submit" 
                                    className={adminLyricsStyles.saveButton}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                                
                                <button 
                                    type="button" 
                                    className={adminLyricsStyles.cancelButton}
                                    onClick={handleCreateNew}
                                >
                                    New Song
                                </button>
                                
                                {!isCreating && (
                                    <button 
                                        type="button" 
                                        className={adminLyricsStyles.deleteButton}
                                        onClick={handleDelete}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>

                            <div className={adminLyricsStyles.analysisPreviewContainer}>
                                {
                                    generatingAnalysis ? (
                                        <div className={adminLyricsStyles.terminalContainer}>
                                            <div className={adminLyricsStyles.terminalHeader}>
                                                <div className={adminLyricsStyles.terminalTitle}>Analysis Progress</div>
                                                <div className={adminLyricsStyles.terminalControls}>
                                                    <div className={adminLyricsStyles.terminalButton}></div>
                                                    <div className={adminLyricsStyles.terminalButton}></div>
                                                    <div className={adminLyricsStyles.terminalButton}></div>
                                                </div>
                                            </div>
                                            <div 
                                                ref={terminalContentRef} 
                                                className={adminLyricsStyles.terminalContent}
                                            >
                                                {analysisLog.map((log, index) => (
                                                    <div 
                                                        key={index} 
                                                        className={`${adminLyricsStyles.logEntry} ${adminLyricsStyles[log.type]}`}
                                                    >
                                                        <span className={adminLyricsStyles.timestamp}>
                                                            {log.timestamp.toLocaleTimeString()}
                                                        </span>
                                                        <span className={adminLyricsStyles.message}>
                                                            {log.message}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            {analysisLog.some(log => log.type === 'progress') && (
                                                <div className={adminLyricsStyles.progressBar}>
                                                    <div 
                                                        className={adminLyricsStyles.progressFill}
                                                        style={{ 
                                                            width: `${analysisLog.find(log => log.type === 'progress')?.progress || 0}%` 
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedLyric?.hasAnalysis ? (
                                        <div className={adminLyricsStyles.analysisActions}>
                                            <Link
                                                href={`/lyrics/${selectedLyric.lyricId}`}>
                                                <IcSharpPreview /> Preview Analysis
                                            </Link>
                                            <div 
                                                className={adminLyricsStyles.deleteAnalysis}
                                                onClick={handleDeleteAnalysis}
                                                style={{ 
                                                    backgroundColor: '#f44336',
                                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                                    opacity: isDeleting ? 0.7 : 1
                                                }}
                                            >
                                                <MaterialSymbolsDeleteOutlineSharp /> Delete Analysis
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            className={adminLyricsStyles.generateAnalysisButton}
                                            onClick={handleGenerateAnalysis}
                                        >
                                            Generate Analysis
                                        </div>
                                    )
                                }
                            </div>
                        </form>
                    </>
                ) : (
                    <div className={adminLyricsStyles.loading}>
                        Select a song to edit or click "Add New Song" to create one
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLyrics;
