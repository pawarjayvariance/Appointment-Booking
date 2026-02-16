import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Button from '../Atoms/Button';
import { Search, Plus, Power, ShieldAlert, CheckCircle } from 'lucide-react';

const TenantTable = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Tenant Form
    const [formData, setFormData] = useState({
        name: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
    });

    const token = localStorage.getItem('token');

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/super-admin/tenants?search=${search}&page=${page}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTenants(res.data.tenants);
            setPagination(res.data.pagination);
        } catch (err) {
            setError('Failed to fetch tenants');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchTenants();
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [search, page]);

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/super-admin/tenants',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFormData({ name: '', adminName: '', adminEmail: '', adminPassword: '' });
            setIsModalOpen(false);
            fetchTenants();
            alert('Tenant and Admin user created successfully');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create tenant');
        }
    };

    const toggleStatus = async (tenantId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            await axios.patch(`http://localhost:5000/api/super-admin/tenants/${tenantId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTenants();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    return (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Tenant Management</h2>
                <Button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Add New Tenant
                </Button>
            </div>

            {/* Search & Stats */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <input
                        type="text"
                        placeholder="Search tenants by name..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        style={searchInputStyle}
                    />
                </div>
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={{ backgroundColor: '#fcfcfc', borderBottom: '2px solid #f1f1f1' }}>
                            <th style={tableHeaderStyle}>Tenant Name</th>
                            <th style={tableHeaderStyle}>Status</th>
                            <th style={tableHeaderStyle}>Staff (Doctors)</th>
                            <th style={tableHeaderStyle}>Total Users</th>
                            <th style={tableHeaderStyle}>Appointments</th>
                            <th style={tableHeaderStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading tenants...</td></tr>
                        ) : tenants.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No tenants found.</td></tr>
                        ) : tenants.map(tenant => (
                            <tr key={tenant.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                <td style={tableCellStyle}>
                                    <Link
                                        to={`/super-admin/tenants/${tenant.id}`}
                                        style={tenantNameLinkStyle}
                                        className="tenant-link"
                                    >
                                        {tenant.name}
                                    </Link>
                                    <div style={{ fontSize: '11px', color: '#999' }}>ID: {tenant.id}</div>
                                </td>
                                <td style={tableCellStyle}>
                                    <span style={{
                                        ...statusBadgeStyle,
                                        backgroundColor: tenant.status === 'active' ? '#e6f4ea' : '#fce8e6',
                                        color: tenant.status === 'active' ? '#1e7e34' : '#d93025'
                                    }}>
                                        {tenant.status === 'active' ? <CheckCircle size={10} style={{ marginRight: '4px' }} /> : <ShieldAlert size={10} style={{ marginRight: '4px' }} />}
                                        {tenant.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={tableCellStyle}>{tenant._count?.doctors}</td>
                                <td style={tableCellStyle}>{tenant._count?.users}</td>
                                <td style={tableCellStyle}>{tenant._count?.appointments}</td>
                                <td style={tableCellStyle}>
                                    <Button
                                        variant={tenant.status === 'active' ? 'danger' : 'secondary'}
                                        onClick={() => toggleStatus(tenant.id, tenant.status)}
                                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Power size={14} /> {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={paginationContainerStyle}>
                <span style={{ color: '#666', fontSize: '14px' }}>
                    Showing page {page} of {pagination.totalPages || 1}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button disabled={page === 1} onClick={() => setPage(p => p - 1)} variant="secondary">Prev</Button>
                    <Button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} variant="secondary">Next</Button>
                </div>
            </div>

            {/* Create Tenant Modal */}
            {isModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginTop: 0 }}>Create New Tenant</h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '1.5rem' }}>This will create a new sub-account and an administrative user.</p>

                        <form onSubmit={handleCreateTenant}>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Tenant / Clinic Name</label>
                                <input
                                    style={inputStyle}
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter clinic name"
                                />
                            </div>

                            <hr style={{ margin: '1.5rem 0', border: '0', borderTop: '1px solid #eee' }} />
                            <h4 style={{ marginBottom: '1rem' }}>Default Admin Credentials</h4>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Full Name</label>
                                <input
                                    style={inputStyle}
                                    required
                                    value={formData.adminName}
                                    onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Email Address</label>
                                <input
                                    style={inputStyle}
                                    type="email"
                                    required
                                    value={formData.adminEmail}
                                    onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                    placeholder="admin@clinic.com"
                                />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Password</label>
                                <input
                                    style={inputStyle}
                                    type="password"
                                    required
                                    value={formData.adminPassword}
                                    onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Create Platform Account</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                .tenant-link:hover { color: #2563eb !important; text-decoration: underline !important; }
            `}} />
        </div>
    );
};

// Styles
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderStyle = { padding: '16px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777', fontWeight: '700' };
const tableCellStyle = { padding: '16px', fontSize: '14px', color: '#444' };
const searchInputStyle = { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' };
const statusBadgeStyle = { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center' };
const paginationContainerStyle = { marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const errorStyle = { backgroundColor: '#fff5f5', color: '#e53e3e', padding: '12px', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #feb2b2' };

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const formGroupStyle = { marginBottom: '1rem' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#555' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', transition: 'border-color 0.2s' };

const tenantNameLinkStyle = { fontWeight: '600', color: '#3b82f6', textDecoration: 'none', transition: 'color 0.2s' };

export default TenantTable;
