import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/Atoms/Button';
import {
    ArrowLeft,
    Building2,
    Users,
    Calendar,
    Star,
    Clock,
    Activity,
    Stethoscope,
    CheckCircle,
    ShieldAlert,
    User
} from 'lucide-react';

const TenantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTenantDetails = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/super-admin/tenants/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTenant(res.data);
            } catch (err) {
                console.error('Failed to fetch tenant details:', err);
                setError('Failed to load tenant details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchTenantDetails();
    }, [id, token]);

    if (loading) return <div style={loadingOverlayStyle}>Loading Tenant Insights...</div>;
    if (error) return <div style={errorStyle}>{error}</div>;
    if (!tenant) return <div>Tenant not found.</div>;

    const getProfilePicUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header / Back Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Button variant="secondary" onClick={() => navigate('/super-admin/tenants')} style={backButtonStyle}>
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h2 style={{ margin: 0, fontWeight: '700' }}>{tenant.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{
                            ...statusBadgeStyle,
                            backgroundColor: tenant.status === 'active' ? '#e6f4ea' : '#fce8e6',
                            color: tenant.status === 'active' ? '#1e7e34' : '#d93025'
                        }}>
                            {tenant.status === 'active' ? <CheckCircle size={10} style={{ marginRight: '4px' }} /> : <ShieldAlert size={10} style={{ marginRight: '4px' }} />}
                            {tenant.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '13px', color: '#666' }}>
                            <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            Established: {new Date(tenant.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div style={kpiGridStyle}>
                <DetailKPICard title="Staff / Doctors" value={tenant.totalDoctors} icon={Stethoscope} color="#3b82f6" />
                <DetailKPICard title="Total Patients" value={tenant.totalUsers} icon={Users} color="#8b5cf6" />
                <DetailKPICard title="Appointments" value={tenant.totalAppointments} icon={Calendar} color="#10b981" />
                <DetailKPICard title="Average Rating" value={tenant.averageRating} icon={Star} color="#f59e0b" suffix="/ 5.0" />
            </div>

            {/* Content Sections */}
            <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
                {/* Doctor Performance List */}
                <div style={sectionCardStyle}>
                    <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Activity size={20} color="#3b82f6" />
                        Medical Staff & Performance Metrics
                    </h4>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f1f1f1' }}>
                                    <th style={tableHeaderStyle}>Doctor</th>
                                    <th style={tableHeaderStyle}>Specialization</th>
                                    <th style={tableHeaderStyle} textAlign="center">Appointments</th>
                                    <th style={tableHeaderStyle} textAlign="center">Avg. Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenant.doctors.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No medical staff assigned to this tenant yet.</td></tr>
                                ) : tenant.doctors.map(doctor => (
                                    <tr key={doctor.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                        <td style={tableCellStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={avatarStyle}>
                                                    {doctor.profilePic ? (
                                                        <img
                                                            src={getProfilePicUrl(doctor.profilePic)}
                                                            alt={doctor.name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <Users size={18} color="#94a3b8" />
                                                    )}
                                                </div>
                                                <Link
                                                    to={`/super-admin/tenants/${id}/doctors/${doctor.id}`}
                                                    style={doctorLinkStyle}
                                                    className="doctor-link"
                                                >
                                                    <div style={{ fontWeight: '600' }}>{doctor.name}</div>
                                                </Link>
                                            </div>
                                        </td>
                                        <td style={tableCellStyle}>{doctor.specialization}</td>
                                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>{doctor.appointments}</td>
                                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: doctor.averageRating >= 4 ? '#10b981' : '#f59e0b',
                                                fontWeight: '600'
                                            }}>
                                                <Star size={14} fill="currentColor" />
                                                {doctor.averageRating || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Patient List */}
                <div style={sectionCardStyle}>
                    <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={20} color="#8b5cf6" />
                        Registered Patients (Latest)
                    </h4>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f1f1f1' }}>
                                    <th style={tableHeaderStyle}>Patient</th>
                                    <th style={tableHeaderStyle}>Email</th>
                                    <th style={tableHeaderStyle}>Joined Date</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenant.users?.filter(u => u.role === 'user').length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No patients registered in this tenant yet.</td></tr>
                                ) : tenant.users?.filter(u => u.role === 'user').map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                        <td style={tableCellStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={avatarStyle}>
                                                    {user.profilePic ? (
                                                        <img
                                                            src={getProfilePicUrl(user.profilePic)}
                                                            alt={user.name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <User size={18} color="#94a3b8" />
                                                    )}
                                                </div>
                                                <Link
                                                    to={user.role === 'doctor' && user.doctor ? `/super-admin/tenants/${id}/doctors/${user.doctor.id}` : `/super-admin/users/${user.id}`}
                                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                                >
                                                    <div style={{ fontWeight: '600', color: '#3b82f6', cursor: 'pointer' }}>{user.name}</div>
                                                </Link>
                                            </div>
                                        </td>
                                        <td style={tableCellStyle}>{user.email}</td>
                                        <td style={tableCellStyle}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                            <Link
                                                to={user.role === 'doctor' && user.doctor ? `/super-admin/tenants/${id}/doctors/${user.doctor.id}` : `/super-admin/users/${user.id}`}
                                                style={doctorLinkStyle}
                                            >
                                                View Profile
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .doctor-link:hover { color: #2563eb !important; text-decoration: underline !important; }
            `}} />
        </div>
    );
};

const DetailKPICard = ({ title, value, icon: Icon, color, suffix }) => (
    <div style={detailKpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>{title}</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: '700', color: '#111' }}>{value}</span>
            {suffix && <span style={{ fontSize: '14px', color: '#999' }}>{suffix}</span>}
        </div>
    </div>
);

// Styles (mostly reused from SuperAdminDashboard for consistency)
const loadingOverlayStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666', fontSize: '16px' };
const errorStyle = { backgroundColor: '#fff5f5', color: '#e53e3e', padding: '12px', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #feb2b2' };
const backButtonStyle = { padding: '8px', minWidth: 'auto', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const kpiGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' };
const detailKpiCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' };
const sectionCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' };
const statusBadgeStyle = { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderStyle = { padding: '12px 16px', fontSize: '13px', textTransform: 'uppercase', color: '#777', fontWeight: '700' };
const tableCellStyle = { padding: '16px', fontSize: '14px', color: '#444' };
const avatarStyle = { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' };
const doctorLinkStyle = { color: '#3b82f6', textDecoration: 'none', transition: 'color 0.2s' };

export default TenantDetail;
