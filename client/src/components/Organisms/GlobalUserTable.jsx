import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Users, Filter } from 'lucide-react';
import Avatar from '../Atoms/Avatar';

const GlobalUserTable = () => {
    const [users, setUsers] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ role: '', tenantId: '' });
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/super-admin/tenants?limit=100', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTenants(res.data.tenants);
            } catch (err) { console.error(err); }
        };
        fetchTenants();
    }, [token]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                ...filter,
                page: page.toString()
            }).toString();

            const res = await axios.get(`http://localhost:5000/api/super-admin/users?${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.users);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filter, page]);

    return (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Platform Users</h2>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid #eee', paddingRight: '1rem' }}>
                        <Filter size={14} color="#777" />
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Filters:</span>
                    </div>

                    <select
                        style={filterSelectStyle}
                        value={filter.role}
                        onChange={e => { setFilter({ ...filter, role: e.target.value }); setPage(1); }}
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="user">User</option>
                    </select>

                    <select
                        style={filterSelectStyle}
                        value={filter.tenantId}
                        onChange={e => { setFilter({ ...filter, tenantId: e.target.value }); setPage(1); }}
                    >
                        <option value="">All Tenants</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={{ backgroundColor: '#fcfcfc', borderBottom: '2px solid #f1f1f1' }}>
                            <th style={tableHeaderStyle}>User Details</th>
                            <th style={tableHeaderStyle}>Role</th>
                            <th style={tableHeaderStyle}>Tenant / Location</th>
                            <th style={tableHeaderStyle}>Joined Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading users...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No users found.</td></tr>
                        ) : users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                <td style={tableCellStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Avatar src={user.profilePic} name={user.name} size="small" />
                                        <div>
                                            <Link
                                                to={user.role === 'doctor' && user.doctor ? `/super-admin/tenants/${user.tenant?.id}/doctors/${user.doctor.id}` : `/super-admin/users/${user.id}`}
                                                style={{ textDecoration: 'none' }}
                                            >
                                                <div style={{ fontWeight: '600', color: '#3b82f6', cursor: 'pointer' }}>{user.name}</div>
                                            </Link>
                                            <div style={{ fontSize: '12px', color: '#777' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={tableCellStyle}>
                                    <span style={{ ...roleBadgeStyle, backgroundColor: getRoleColor(user.role).bg, color: getRoleColor(user.role).text }}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={tableCellStyle}>
                                    <Link to={`/super-admin/tenants/${user.tenant?.id}`} style={{ textDecoration: 'none' }}>
                                        <div style={{ fontWeight: '500', color: '#3b82f6', cursor: 'pointer' }}>{user.tenant?.name || 'Platform'}</div>
                                    </Link>
                                </td>
                                <td style={tableCellStyle}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={paginationStyle}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    style={pageButtonStyle}
                >Previous</button>
                <span style={{ fontSize: '14px', color: '#666' }}>Page {page} of {pagination.totalPages || 1}</span>
                <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    style={pageButtonStyle}
                >Next</button>
            </div>
        </div>
    );
};

const getRoleColor = (role) => {
    switch (role) {
        case 'admin': return { bg: '#eef2ff', text: '#4338ca' };
        case 'doctor': return { bg: '#ecfdf5', text: '#059669' };
        default: return { bg: '#f9fafb', text: '#6b7280' };
    }
}

const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderStyle = { padding: '16px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777', fontWeight: '700' };
const tableCellStyle = { padding: '16px', fontSize: '14px', color: '#444' };
const roleBadgeStyle = { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' };
const filterSelectStyle = { padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', backgroundColor: '#fcfcfc' };
const paginationStyle = { marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' };
const pageButtonStyle = { padding: '6px 12px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px' };

export default GlobalUserTable;
