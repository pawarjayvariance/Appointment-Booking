import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../Atoms/Button';
import Avatar from '../Atoms/Avatar';
import useDebounce from '../../hooks/useDebounce';

const UserTable = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter Inputs (Immediate State)
    const [nameInput, setNameInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [roleFilter, setRoleFilter] = useState(''); // Role is a select, so we can keep it direct

    // Debounced Filters (Delayed State for fetching)
    const debouncedName = useDebounce(nameInput, 300);
    const debouncedEmail = useDebounce(emailInput, 300);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const token = localStorage.getItem('token');

    // Reset to page 1 when actual filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedName, debouncedEmail, roleFilter]);

    // Fetch users with filters
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: 10
                });

                if (debouncedName) params.append('name', debouncedName);
                if (debouncedEmail) params.append('email', debouncedEmail);
                if (roleFilter) params.append('role', roleFilter);

                const res = await axios.get(
                    `http://localhost:5000/api/admin/users?${params}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setUsers(res.data.users);
                setTotalPages(res.data.pagination.totalPages);
                setTotalCount(res.data.pagination.totalCount);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [currentPage, debouncedName, debouncedEmail, roleFilter, token]);

    // Handlers
    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
    };

    return (
        <div style={{ flex: 1, padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>User Management</h2>

            {/* Results Count */}
            <div style={{ marginBottom: '1rem', color: '#666', fontSize: '14px' }}>
                Showing {users.length} of {totalCount} users
            </div>

            {/* Role Tabs */}
            <div style={tabsContainerStyle}>
                {['', 'super_admin', 'admin', 'doctor', 'user'].map(role => (
                    <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        style={{
                            ...tabItemStyle,
                            ...(roleFilter === role ? activeTabItemStyle : {})
                        }}
                    >
                        {role === '' ? 'All Users' : role.replace('_', ' ').charAt(0).toUpperCase() + role.replace('_', ' ').slice(1) + 's'}
                    </button>
                ))}
            </div>

            {/* Table */}
            {!error && (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={tableHeaderStyle}>#</th>
                                    <th style={tableHeaderStyle}>Name</th>
                                    <th style={tableHeaderStyle}>Email</th>
                                    <th style={tableHeaderStyle}>Role</th>
                                </tr>
                                {/* Filter Row */}
                                <tr style={{ backgroundColor: '#fff' }}>
                                    <th style={filterCellStyle}></th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={nameInput}
                                            onChange={handleInputChange(setNameInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={emailInput}
                                            onChange={handleInputChange(setEmailInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                    <th style={filterCellStyle}>
                                        {/* Role filter removed from here as it's now in tabs */}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{
                                            textAlign: 'center',
                                            padding: '3rem',
                                            color: '#666',
                                            backgroundColor: '#f9f9f9'
                                        }}>
                                            No users found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, index) => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={tableCellStyle}>
                                                {(currentPage - 1) * 10 + index + 1}
                                            </td>
                                            <td style={tableCellStyle}>
                                                <Link
                                                    to={user.role === 'doctor' && user.doctor ? `/admin/doctors/${user.doctor.id}` : `/admin/users/${user.id}`}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}
                                                >
                                                    <Avatar src={user.profilePic} name={user.name} size="small" />
                                                    <span style={{ fontWeight: '500', color: '#007bff', cursor: 'pointer' }}>{user.name}</span>
                                                </Link>
                                            </td>
                                            <td style={tableCellStyle}>{user.email}</td>
                                            <td style={tableCellStyle}>
                                                <span style={{
                                                    ...roleBadgeStyle,
                                                    backgroundColor: getRoleColor(user.role)
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '1rem',
                            marginTop: '2rem'
                        }}>
                            <Button
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                disabled={currentPage === 1}
                                variant="secondary"
                            >
                                <ChevronLeft size={18} /> Previous
                            </Button>

                            <span style={{ color: '#666', fontSize: '14px' }}>
                                Page {currentPage} of {totalPages}
                            </span>

                            <Button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage === totalPages}
                                variant="secondary"
                            >
                                Next <ChevronRight size={18} />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div >
    );
};

// Helper function for role badge colors
const getRoleColor = (role) => {
    switch (role) {
        case 'super_admin':
            return '#6f42c1'; // Deep Purple
        case 'admin':
            return '#dc3545';
        case 'doctor':
            return '#28a745';
        case 'user':
            return '#007bff';
        default:
            return '#6c757d';
    }
};

// Styles
const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    overflow: 'hidden'
};

const tableHeaderStyle = {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '14px',
    color: '#333',
    borderBottom: '2px solid #ddd'
};

const filterCellStyle = {
    padding: '8px 12px',
    borderBottom: '1px solid #ddd'
};

const filterInputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px'
};

const tableCellStyle = {
    padding: '12px',
    fontSize: '14px',
    color: '#555'
};

const roleBadgeStyle = {
    padding: '4px 0',
    width: '120px',
    display: 'inline-block',
    textAlign: 'center',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
};

const tabsContainerStyle = {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #dee2e6',
    paddingBottom: '0.5rem'
};

const tabItemStyle = {
    padding: '0.5rem 1.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6c757d',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    borderRadius: '4px',
    outline: 'none'
};

const activeTabItemStyle = {
    backgroundColor: '#007bff',
    color: 'white'
};

export default UserTable;
