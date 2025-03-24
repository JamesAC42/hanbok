'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import adminStyles from '@/styles/components/admin.module.scss';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

const Admin = () => {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const { t } = useLanguage();
    
    // State for feature usage data
    const [usageData, setUsageData] = useState([]);
    const [summaryStats, setSummaryStats] = useState([]);
    const [features, setFeatures] = useState([]);
    const [users, setUsers] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // State for rate limit data
    const [rateLimitData, setRateLimitData] = useState([]);
    const [loadingRateLimits, setLoadingRateLimits] = useState(true);
    const [rateLimitError, setRateLimitError] = useState(null);
    const [totalAnonymousUsers, setTotalAnonymousUsers] = useState(0);
    const [totalAnonymousSentences, setTotalAnonymousSentences] = useState(0);
    
    // Pagination and filtering state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedFeature, setSelectedFeature] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [sortBy, setSortBy] = useState('count');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Pagination for rate limit data
    const [rateLimitPage, setRateLimitPage] = useState(1);
    const [rateLimitLimit, setRateLimitLimit] = useState(20);
    const [rateLimitTotalPages, setRateLimitTotalPages] = useState(1);
    const [rateLimitSortBy, setRateLimitSortBy] = useState('weekSentences');
    const [rateLimitSortOrder, setRateLimitSortOrder] = useState('desc');
    
    // Check if user is authenticated
    useEffect(() => {
        if (loading) return;
        
        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, loading, router]);
    
    // Fetch feature usage data and check admin status
    useEffect(() => {
        const fetchFeatureUsage = async () => {
            if (!user) return;
            
            try {
                setLoadingData(true);
                setError(null);
                
                const queryParams = new URLSearchParams({
                    page,
                    limit,
                    sortBy,
                    sortOrder,
                    ...(selectedFeature && { feature: selectedFeature }),
                    ...(selectedUser && { userId: selectedUser })
                });
                
                const response = await fetch(`/api/admin/feature-usage?${queryParams}`);
                
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        // Not authenticated or not authorized - redirect to home
                        router.replace('/');
                        return;
                    }
                    throw new Error('Failed to fetch feature usage data');
                }
                
                // If we get here, the user is an admin
                setIsAdmin(true);
                
                const data = await response.json();
                
                if (data.success) {
                    setUsageData(data.usageData);
                    setSummaryStats(data.summaryStats);
                    setFeatures(data.features);
                    
                    // Use the users from the backend instead of extracting them
                    if (data.users) {
                        setUsers(data.users);
                    }
                    
                    setTotalPages(data.pagination.totalPages);
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            } catch (err) {
                console.error('Error fetching feature usage:', err);
                setError(err.message);
            } finally {
                setLoadingData(false);
            }
        };
        
        fetchFeatureUsage();
    }, [user, page, limit, selectedFeature, selectedUser, sortBy, sortOrder, router]);
    
    // Fetch rate limit data for anonymous users
    useEffect(() => {
        const fetchRateLimitData = async () => {
            if (!user || !isAdmin) return;
            
            try {
                setLoadingRateLimits(true);
                setRateLimitError(null);
                
                const queryParams = new URLSearchParams({
                    page: rateLimitPage,
                    limit: rateLimitLimit,
                    sortBy: rateLimitSortBy,
                    sortOrder: rateLimitSortOrder,
                    identifierType: 'ipAddress' // Only fetch data for anonymous users
                });
                
                const response = await fetch(`/api/admin/rate-limits?${queryParams}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch rate limit data');
                }
                
                const data = await response.json();
                
                if (data.success) {
                    setRateLimitData(data.rateLimits);
                    setRateLimitTotalPages(data.pagination.totalPages);
                    setTotalAnonymousUsers(data.totalAnonymousUsers || 0);
                    setTotalAnonymousSentences(data.totalAnonymousSentences || 0);
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            } catch (err) {
                console.error('Error fetching rate limit data:', err);
                setRateLimitError(err.message);
            } finally {
                setLoadingRateLimits(false);
            }
        };
        
        fetchRateLimitData();
    }, [user, isAdmin, rateLimitPage, rateLimitLimit, rateLimitSortBy, rateLimitSortOrder]);
    
    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Handle sort change
    const handleSortChange = (field) => {
        if (sortBy === field) {
            // Toggle sort order if clicking the same field
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Default to descending for new sort field
            setSortBy(field);
            setSortOrder('desc');
        }
    };
    
    // Handle sort change for rate limit table
    const handleRateLimitSortChange = (field) => {
        if (rateLimitSortBy === field) {
            // Toggle sort order if clicking the same field
            setRateLimitSortOrder(rateLimitSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Default to descending for new sort field
            setRateLimitSortBy(field);
            setRateLimitSortOrder('desc');
        }
    };
    
    // Don't render while loading auth or if not an admin
    if (loading || !isAuthenticated || !isAdmin) {
        return null;
    }
    
    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={adminStyles.adminContent}>
                    <h1 className={styles.pageTitle}>Admin Dashboard</h1>
                    
                    {error && (
                        <div className={adminStyles.error}>
                            Error: {error}
                        </div>
                    )}
                    
                    {/* Anonymous Users Rate Limit Section */}
                    <section className={adminStyles.detailedSection}>
                        <h2>Anonymous Users Sentence Generation</h2>
                        
                        {rateLimitError && (
                            <div className={adminStyles.error}>
                                Error: {rateLimitError}
                            </div>
                        )}
                        
                        <div className={adminStyles.summarySection}>
                            <div className={adminStyles.summaryGrid}>
                                <div className={adminStyles.summaryCard}>
                                    <h3>Anonymous Users</h3>
                                    <div className={adminStyles.statItem}>
                                        <span>Total IPs:</span>
                                        <strong>{totalAnonymousUsers.toLocaleString()}</strong>
                                    </div>
                                    <div className={adminStyles.statItem}>
                                        <span>Total Sentences:</span>
                                        <strong>{totalAnonymousSentences.toLocaleString()}</strong>
                                    </div>
                                    <div className={adminStyles.statItem}>
                                        <span>Avg Per IP:</span>
                                        <strong>
                                            {totalAnonymousUsers > 0 
                                                ? (totalAnonymousSentences / totalAnonymousUsers).toFixed(1) 
                                                : '0.0'}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {loadingRateLimits ? (
                            <div className={adminStyles.loading}>Loading rate limit data...</div>
                        ) : rateLimitData.length === 0 ? (
                            <div className={adminStyles.noData}>No anonymous user data available</div>
                        ) : (
                            <>
                                <div className={adminStyles.tableContainer}>
                                    <table className={adminStyles.usageTable}>
                                        <thead>
                                            <tr>
                                                <th>IP Address</th>
                                                <th 
                                                    className={adminStyles.sortable}
                                                    onClick={() => handleRateLimitSortChange('totalSentences')}
                                                >
                                                    Total Sentences
                                                    {rateLimitSortBy === 'totalSentences' && (
                                                        <span className={adminStyles.sortIcon}>
                                                            {rateLimitSortOrder === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </th>
                                                <th 
                                                    className={adminStyles.sortable}
                                                    onClick={() => handleRateLimitSortChange('weekSentences')}
                                                >
                                                    Weekly Sentences
                                                    {rateLimitSortBy === 'weekSentences' && (
                                                        <span className={adminStyles.sortIcon}>
                                                            {rateLimitSortOrder === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </th>
                                                <th 
                                                    className={adminStyles.sortable}
                                                    onClick={() => handleRateLimitSortChange('weekStartDate')}
                                                >
                                                    Week Start Date
                                                    {rateLimitSortBy === 'weekStartDate' && (
                                                        <span className={adminStyles.sortIcon}>
                                                            {rateLimitSortOrder === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </th>
                                                <th 
                                                    className={adminStyles.sortable}
                                                    onClick={() => handleRateLimitSortChange('lastUpdated')}
                                                >
                                                    Last Updated
                                                    {rateLimitSortBy === 'lastUpdated' && (
                                                        <span className={adminStyles.sortIcon}>
                                                            {rateLimitSortOrder === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rateLimitData.map((item, index) => (
                                                <tr key={`${item.identifier}-${index}`}>
                                                    <td>{item.identifier}</td>
                                                    <td>{item.totalSentences.toLocaleString()}</td>
                                                    <td>{item.weekSentences.toLocaleString()}</td>
                                                    <td>{formatDate(item.weekStartDate)}</td>
                                                    <td>{formatDate(item.lastUpdated)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Pagination for rate limit data */}
                                {rateLimitTotalPages > 1 && (
                                    <div className={adminStyles.pagination}>
                                        <button 
                                            onClick={() => setRateLimitPage(p => Math.max(1, p - 1))}
                                            disabled={rateLimitPage === 1}
                                        >
                                            Previous
                                        </button>
                                        <span>
                                            Page {rateLimitPage} of {rateLimitTotalPages}
                                        </span>
                                        <button 
                                            onClick={() => setRateLimitPage(p => Math.min(rateLimitTotalPages, p + 1))}
                                            disabled={rateLimitPage === rateLimitTotalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                                
                                <div className={adminStyles.limitContainer}>
                                    <label htmlFor="rate-limit-select">Items per page:</label>
                                    <select
                                        id="rate-limit-select"
                                        value={rateLimitLimit}
                                        onChange={(e) => {
                                            setRateLimitLimit(Number(e.target.value));
                                            setRateLimitPage(1); // Reset to first page when changing limit
                                        }}
                                    >
                                        <option value={1}>1</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </section>
                    
                    {/* Feature Usage Section */}
                    <section className={adminStyles.detailedSection}>
                        <h2>Feature Usage Dashboard</h2>
                        
                        {/* Feature filter and controls */}
                        <div className={adminStyles.controls}>
                            <div className={adminStyles.filterContainer}>
                                <label htmlFor="feature-filter">Filter by feature:</label>
                                <select 
                                    id="feature-filter"
                                    value={selectedFeature}
                                    onChange={(e) => {
                                        setSelectedFeature(e.target.value);
                                        setPage(1); // Reset to first page when changing filter
                                    }}
                                >
                                    <option value="">All Features</option>
                                    {features.map(feature => (
                                        <option key={feature} value={feature}>
                                            {feature.replace('_', ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className={adminStyles.filterContainer}>
                                <label htmlFor="user-filter">Filter by user:</label>
                                <select 
                                    id="user-filter"
                                    value={selectedUser}
                                    onChange={(e) => {
                                        setSelectedUser(e.target.value);
                                        setPage(1); // Reset to first page when changing filter
                                    }}
                                >
                                    <option value="">All Users</option>
                                    {users.map(userItem => (
                                        <option key={userItem.userId} value={userItem.userId}>
                                            {userItem.name} ({userItem.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className={adminStyles.limitContainer}>
                                <label htmlFor="limit-select">Items per page:</label>
                                <select
                                    id="limit-select"
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1); // Reset to first page when changing limit
                                    }}
                                >
                                    <option value={1}>1</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Summary statistics */}
                        <section className={adminStyles.summarySection}>
                            <h2>Summary Statistics</h2>
                            {loadingData ? (
                                <div className={adminStyles.loading}>Loading statistics...</div>
                            ) : summaryStats.length === 0 ? (
                                <div className={adminStyles.noData}>No data available</div>
                            ) : (
                                <div className={adminStyles.summaryGrid}>
                                    {summaryStats.map(stat => (
                                        <div key={stat._id} className={adminStyles.summaryCard}>
                                            <h3>{stat._id.replace('_', ' ')}</h3>
                                            <div className={adminStyles.statItem}>
                                                <span>Total Usage:</span>
                                                <strong>{stat.totalUsage.toLocaleString()}</strong>
                                            </div>
                                            <div className={adminStyles.statItem}>
                                                <span>Users:</span>
                                                <strong>{stat.userCount.toLocaleString()}</strong>
                                            </div>
                                            <div className={adminStyles.statItem}>
                                                <span>Avg Per User:</span>
                                                <strong>{stat.avgUsagePerUser.toFixed(1)}</strong>
                                            </div>
                                            <div className={adminStyles.statItem}>
                                                <span>Max By User:</span>
                                                <strong>{stat.maxUsageByUser.toLocaleString()}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                        
                        {/* Detailed usage data */}
                        <section className={adminStyles.detailedSection}>
                            {loadingData ? (
                                <div className={adminStyles.loading}>Loading data...</div>
                            ) : usageData.length === 0 ? (
                                <div className={adminStyles.noData}>No data available</div>
                            ) : (
                                <>
                                    <div className={adminStyles.tableContainer}>
                                        <table className={adminStyles.usageTable}>
                                            <thead>
                                                <tr>
                                                    <th>User</th>
                                                    <th>Email</th>
                                                    <th>Tier</th>
                                                    <th 
                                                        className={adminStyles.sortable}
                                                        onClick={() => handleSortChange('feature')}
                                                    >
                                                        Feature
                                                        {sortBy === 'feature' && (
                                                            <span className={adminStyles.sortIcon}>
                                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </th>
                                                    <th 
                                                        className={adminStyles.sortable}
                                                        onClick={() => handleSortChange('count')}
                                                    >
                                                        Count
                                                        {sortBy === 'count' && (
                                                            <span className={adminStyles.sortIcon}>
                                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </th>
                                                    <th 
                                                        className={adminStyles.sortable}
                                                        onClick={() => handleSortChange('firstUsed')}
                                                    >
                                                        First Used
                                                        {sortBy === 'firstUsed' && (
                                                            <span className={adminStyles.sortIcon}>
                                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </th>
                                                    <th 
                                                        className={adminStyles.sortable}
                                                        onClick={() => handleSortChange('lastUsed')}
                                                    >
                                                        Last Used
                                                        {sortBy === 'lastUsed' && (
                                                            <span className={adminStyles.sortIcon}>
                                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usageData.map((item, index) => (
                                                    <tr key={`${item.userId}-${item.feature}-${index}`}>
                                                        <td>{item.userName}</td>
                                                        <td>{item.userEmail}</td>
                                                        <td>{item.userTier === 0 ? 'Free' : 'Plus'}</td>
                                                        <td>{item.feature.replace('_', ' ')}</td>
                                                        <td>{item.count.toLocaleString()}</td>
                                                        <td>{formatDate(item.firstUsed)}</td>
                                                        <td>{formatDate(item.lastUsed)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className={adminStyles.pagination}>
                                            <button 
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                Previous
                                            </button>
                                            <span>
                                                Page {page} of {totalPages}
                                            </span>
                                            <button 
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </section>
                </div>
            </div>
            <div className={styles.girlContainer}>
                <Image
                    src="/images/girl1.png"
                    alt="girl"
                    width={1920}
                    height={1080}
                    priority
                />
            </div>
        </div>
    );
};

export default Admin; 