'use client';
import { useState, useEffect } from 'react';
import styles from '@/styles/components/admin.module.scss';
import EditUserModal from './EditUserModal';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [summaryStats, setSummaryStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Pagination and filtering state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [sortBy, setSortBy] = useState('dateCreated');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    // Fetch users data
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const queryParams = new URLSearchParams({
                page,
                limit,
                sortBy,
                sortOrder,
                ...(search && { search }),
                ...(tierFilter !== '' && { tier: tierFilter })
            });
            
            const response = await fetch(`/api/admin/users?${queryParams}`);
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Unauthorized access');
                }
                throw new Error('Failed to fetch users');
            }
            
            const data = await response.json();
            
            if (data.success) {
                setUsers(data.users);
                setSummaryStats(data.summaryStats);
                setTotalPages(data.pagination.totalPages);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Effect to fetch users when parameters change
    useEffect(() => {
        fetchUsers();
    }, [page, limit, search, tierFilter, sortBy, sortOrder]);
    
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
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(1);
    };
    
    // Handle search with debounce
    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1);
    };
    
    // Handle tier filter change
    const handleTierFilterChange = (value) => {
        setTierFilter(value);
        setPage(1);
    };
    
    // Handle user edit
    const handleEditUser = (user) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };
    
    // Handle user update success
    const handleUserUpdated = (updatedUser) => {
        setUsers(prevUsers => 
            prevUsers.map(user => 
                user.userId === updatedUser.userId ? updatedUser : user
            )
        );
        setShowEditModal(false);
        setSelectedUser(null);
    };
    
    // Get tier display name
    const getTierName = (tier) => {
        switch (tier) {
            case 0: return 'Free';
            case 1: return 'Basic';
            case 2: return 'Plus';
            default: return 'Unknown';
        }
    };
    
    // Get tier badge style
    const getTierBadgeClass = (tier) => {
        switch (tier) {
            case 0: return styles.tierFree;
            case 1: return styles.tierBasic;
            case 2: return styles.tierPlus;
            default: return '';
        }
    };
    
    return (
        <section className={styles.detailedSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>User Management</h2>
                {summaryStats.length > 0 && (
                    <div className={styles.summaryStatMini}>
                        {summaryStats.map(stat => (
                            <span key={stat._id}>{stat.tierName}: <strong>{stat.count.toLocaleString()}</strong></span>
                        ))}
                    </div>
                )}
            </div>
            
            {error && (
                <div className={styles.error}>
                    Error: {error}
                </div>
            )}
            
            {/* Search and filters */}
            <div className={styles.controls}>
                <div className={styles.filterContainer}>
                    <label htmlFor="user-search">Search</label>
                    <input
                        id="user-search"
                        type="text"
                        placeholder="Email or name..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className={styles.adminSelect}
                        style={{ paddingRight: '0.75rem', backgroundImage: 'none', minWidth: '15rem' }}
                    />
                </div>
                
                <div className={styles.filterContainer}>
                    <label htmlFor="tier-filter">Tier</label>
                    <select 
                        id="tier-filter"
                        value={tierFilter}
                        onChange={(e) => handleTierFilterChange(e.target.value)}
                        className={styles.adminSelect}
                    >
                        <option value="">All Tiers</option>
                        <option value="0">Free</option>
                        <option value="1">Basic</option>
                        <option value="2">Plus</option>
                    </select>
                </div>
            </div>
            
            {/* Users table */}
            {loading ? (
                <div className={styles.loading}>Loading users...</div>
            ) : users.length === 0 ? (
                <div className={styles.noData}>No users found</div>
            ) : (
                <>
                    <div className={styles.tableContainer}>
                        <table className={styles.usageTable}>
                            <thead>
                                <tr>
                                    <th 
                                        className={styles.sortable}
                                        onClick={() => handleSortChange('name')}
                                    >
                                        Name
                                        {sortBy === 'name' && (
                                            <span className={styles.sortIcon}>
                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                    <th 
                                        className={styles.sortable}
                                        onClick={() => handleSortChange('email')}
                                    >
                                        Email
                                        {sortBy === 'email' && (
                                            <span className={styles.sortIcon}>
                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                    <th 
                                        className={styles.sortable}
                                        onClick={() => handleSortChange('tier')}
                                    >
                                        Tier
                                        {sortBy === 'tier' && (
                                            <span className={styles.sortIcon}>
                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                    <th 
                                        className={styles.sortable}
                                        onClick={() => handleSortChange('dateCreated')}
                                    >
                                        Joined
                                        {sortBy === 'dateCreated' && (
                                            <span className={styles.sortIcon}>
                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.userId}>
                                        <td>{user.name}</td>
                                        <td className={styles.emailCell}>{user.email}</td>
                                        <td>
                                            <span className={`${styles.tierBadge} ${getTierBadgeClass(user.tier)}`}>
                                                {getTierName(user.tier)}
                                            </span>
                                        </td>
                                        <td>{formatDate(user.dateCreated)}</td>
                                        <td>
                                            <span className={user.verified ? styles.verified : styles.unverified}>
                                                {user.verified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className={styles.adminButton}
                                                style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                                                onClick={() => handleEditUser(user)}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className={styles.tableFooter}>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
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

                        <div className={styles.limitContainer}>
                            <label htmlFor="limit-select">Show</label>
                            <select
                                id="limit-select"
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className={styles.adminSelect}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                </>
            )}
            
            {/* Edit user modal */}
            {showEditModal && selectedUser && (
                <EditUserModal
                    user={selectedUser}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                    }}
                    onUserUpdated={handleUserUpdated}
                />
            )}
        </section>
    );
};

export default UserManagement; 