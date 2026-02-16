import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/Atoms/Button';
import {
    ArrowLeft,
    User,
    Calendar,
    CheckCircle,
    XCircle,
    Mail,
    Building,
    Clock,
    Activity,
    Stethoscope,
    ChevronLeft,
    ChevronRight,
    Shield
} from 'lucide-react';

const UserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const token = localStorage.getItem('token');

    // Detect role context from URL
    const isDoctor = location.pathname.startsWith('/doctor');
    const isAdmin = location.pathname.startsWith('/admin');
    const rolePrefix = isDoctor ? 'doctor' : isAdmin ? 'admin' : 'super-admin';
    const apiBase = `http://localhost:5000/api/${rolePrefix}/users/${userId}`;

    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${apiBase}?page=${page}&limit=10`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(res.data);
            } catch (err) {
                console.error('Failed to fetch user details:', err);
                setError('Failed to load user details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchUserDetails();
    }, [userId, page, token, apiBase]);

    const getProfilePicUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const formatDateTime = (slot) => {
        if (!slot) return 'N/A';
        const date = new Date(slot.date).toLocaleDateString();
        return `${date} at ${slot.startTime}`;
    };

    if (loading && !userData) return <div style={loadingOverlayStyle}>Retrieving User Intelligence...</div>;
    if (error) return <div style={errorStyle}>{error}</div>;
    if (!userData) return <div>User information not found.</div>;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header / Back Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <Button variant="secondary" onClick={() => navigate(-1)} style={backButtonStyle}>
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h2 style={{ margin: 0, fontWeight: '700' }}>User Profile</h2>
                    <span style={{ fontSize: '14px', color: '#666' }}>Comprehensive identity and activity audit</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 3fr', gap: '2.5rem' }}>
                {/* Left Column: Identity */}
                <div style={identitySectionStyle}>
                    <div style={largeAvatarContainer}>
                        {userData.profilePic ? (
                            <img
                                src={getProfilePicUrl(userData.profilePic)}
                                alt={userData.name}
                                style={largeAvatarImage}
                            />
                        ) : (
                            <User size={64} color="#94a3b8" />
                        )}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '22px', fontWeight: '700' }}>{userData.name}</h3>
                        <div style={roleBadgeStyle(userData.role)}>{userData.role.toUpperCase()}</div>
                    </div>

                    <div style={infoListStyle}>
                        <InfoItem icon={Mail} label="Email Address" value={userData.email} />
                        <InfoItem icon={Building} label="Main Tenant" value={userData.tenant?.name || 'Platform (No Tenant)'} />
                        <InfoItem icon={Calendar} label="Joined Date" value={new Date(userData.createdAt).toLocaleDateString()} />
                        <InfoItem icon={Shield} label="Account ID" value={`#${userData.id.substring(0, 8)}...`} />
                    </div>

                    {userData.doctor && (
                        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f0f9ff', borderRadius: '16px', border: '1px solid #bae6fd' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <Stethoscope size={20} color="#0284c7" />
                                <span style={{ fontWeight: '700', color: '#0369a1' }}>Professional Profile</span>
                            </div>
                            <Button
                                variant="primary"
                                onClick={() => navigate(`/${rolePrefix}/doctors/${userData.doctor.id}`)}
                                style={{ width: '100%', fontSize: '14px' }}
                            >
                                View Doctor Details
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Column: Stats & History */}
                <div>
                    <div style={kpiGridStyle}>
                        <DetailKPICard title="Total Sessions" value={userData.stats.total} icon={Activity} color="#3b82f6" />
                        <DetailKPICard title="Total Reviews" value={userData.stats.reviews} icon={CheckCircle} color="#10b981" />
                        <DetailKPICard title="Member Since" value={new Date(userData.stats.joinedDate).toLocaleDateString()} icon={Calendar} color="#8b5cf6" />
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={sectionCardStyle}>
                            <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Clock size={20} color="#3b82f6" />
                                Appointment History
                            </h4>

                            {userData.appointments.length === 0 ? (
                                <div style={emptyStateStyle}>
                                    No appointment records found for this user.
                                </div>
                            ) : (
                                <>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={tableStyle}>
                                            <thead>
                                                <tr>
                                                    <th style={tableHeaderStyle}>#</th>
                                                    <th style={tableHeaderStyle}>Doctor & Clinic</th>
                                                    <th style={tableHeaderStyle}>Schedule</th>
                                                    <th style={tableHeaderStyle}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userData.appointments.map((appt, idx) => (
                                                    <tr key={appt.id} style={tableRowStyle}>
                                                        <td style={tableCellStyle}>{(page - 1) * 10 + idx + 1}</td>
                                                        <td style={tableCellStyle}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <Stethoscope size={14} color="#3b82f6" />
                                                                    <Link
                                                                        to={`/${rolePrefix}/doctors/${appt.doctor.id}`}
                                                                        style={doctorLinkStyle}
                                                                    >
                                                                        {appt.doctor.name}
                                                                    </Link>
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '20px' }}>
                                                                    <Building size={10} />
                                                                    {appt.tenant?.name || 'Unknown Clinic'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={tableCellStyle}>{formatDateTime(appt.timeSlot)}</td>
                                                        <td style={tableCellStyle}>
                                                            <span style={statusBadgeStyle(appt.status || 'scheduled')}>
                                                                {(appt.status || 'scheduled').charAt(0).toUpperCase() + (appt.status || 'scheduled').slice(1)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {userData.pagination.totalPages > 1 && (
                                        <div style={paginationContainer}>
                                            <Button
                                                variant="secondary"
                                                disabled={page === 1}
                                                onClick={() => setPage(p => p - 1)}
                                                style={pageButtonStyle}
                                            >
                                                <ChevronLeft size={16} />
                                            </Button>
                                            <span style={pageIndicatorStyle}>
                                                Page {page} of {userData.pagination.totalPages}
                                            </span>
                                            <Button
                                                variant="secondary"
                                                disabled={page === userData.pagination.totalPages}
                                                onClick={() => setPage(p => p + 1)}
                                                style={pageButtonStyle}
                                            >
                                                <ChevronRight size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Icon size={16} color="#64748b" />
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{value}</div>
        </div>
    </div>
);

const DetailKPICard = ({ title, value, icon: Icon, color }) => (
    <div style={detailKpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>{title}</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
            </div>
        </div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{value}</div>
    </div>
);

// Styles
const loadingOverlayStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#64748b', fontSize: '16px', fontWeight: '500' };
const errorStyle = { backgroundColor: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #fecaca', textAlign: 'center' };
const backButtonStyle = { padding: '8px', minWidth: 'auto', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const identitySectionStyle = { backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', alignSelf: 'start', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' };
const largeAvatarContainer = { width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#f1f5f9', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' };
const largeAvatarImage = { width: '100%', height: '100%', objectFit: 'cover' };
const roleBadgeStyle = (role) => ({ display: 'inline-block', backgroundColor: role === 'super_admin' ? '#fdead7' : role === 'admin' ? '#e0e7ff' : '#f1f5f9', color: role === 'super_admin' ? '#9a4710' : role === 'admin' ? '#3730a3' : '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.02em' });
const infoListStyle = { marginTop: '2.5rem', display: 'flex', flexDirection: 'column' };
const kpiGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' };
const detailKpiCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' };
const sectionCardStyle = { backgroundColor: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' };
const tableStyle = { width: '100%', borderCollapse: 'separate', borderSpacing: '0' };
const tableHeaderStyle = { textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9' };
const tableRowStyle = { transition: 'background-color 0.2s' };
const tableCellStyle = { padding: '16px', fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' };
const doctorLinkStyle = { color: '#3b82f6', textDecoration: 'none', fontWeight: '600' };
const emptyStateStyle = { textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #e2e8f0' };

const statusBadgeStyle = (status) => {
    let bg = '#f1f5f9', color = '#475569';
    if (status === 'completed') { bg = '#dcfce7'; color = '#166534'; }
    if (status === 'cancelled') { bg = '#fee2e2'; color = '#991b1b'; }
    if (status === 'scheduled') { bg = '#e0e7ff'; color = '#3730a3'; }
    return { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', backgroundColor: bg, color: color };
};

const paginationContainer = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '2rem' };
const pageButtonStyle = { width: '36px', height: '36px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' };
const pageIndicatorStyle = { fontSize: '14px', fontWeight: '600', color: '#64748b' };

export default UserDetail;
