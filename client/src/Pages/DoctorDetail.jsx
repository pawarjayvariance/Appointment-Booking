import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/Atoms/Button';
import {
    ArrowLeft,
    Users,
    Calendar,
    Star,
    Clock,
    Activity,
    Stethoscope,
    Globe,
    Timer,
    MessageSquare,
    Edit3
} from 'lucide-react';
import { getProfilePicUrl } from '../utils/imageUtils';
import Avatar from '../components/Atoms/Avatar';
import ProfileSection from '../components/Organisms/ProfileSection';

const DoctorDetail = () => {
    const { tenantId, doctorId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const token = localStorage.getItem('token');

    // Detect role context from URL
    const isAdmin = location.pathname.startsWith('/admin');
    const isSuperAdmin = location.pathname.startsWith('/super-admin');
    const isDoctorView = location.pathname.startsWith('/doctor');
    const isUserRole = location.pathname.startsWith('/doctor/') && !isDoctorView; // Special case for player view

    // Actually, let's make it simpler based on role or path
    const isPatientView = !isAdmin && !isSuperAdmin && !isDoctorView && location.pathname.includes('/doctor/');

    // Sub-contexts for doctor role
    const isDoctorSelf = location.pathname === '/doctor/profile';
    const isDoctorColleague = location.pathname.startsWith('/doctor/doctors/');

    const rolePrefix = isAdmin ? 'admin' : isDoctorView ? 'doctor' : isSuperAdmin ? 'super-admin' : 'user';

    // Determine API URL
    let apiBase = '';
    if (isDoctorSelf) {
        apiBase = `/doctor/profile`;
    } else if (isDoctorColleague) {
        apiBase = `/doctor/doctors/${doctorId}`;
    } else if (isAdmin) {
        apiBase = `/admin/doctors/${doctorId}`;
    } else if (isSuperAdmin) {
        apiBase = `/super-admin/tenants/${tenantId}/doctors/${doctorId}`;
    } else {
        // Patient view
        apiBase = `/doctors/${doctorId}`;
    }

    useEffect(() => {
        const fetchDoctorDetails = async () => {
            setLoading(true);
            try {
                const res = await api.get(apiBase);
                setDoctor(res.data);
            } catch (err) {
                console.error('Failed to fetch doctor details:', err);
                setError('Failed to load doctor details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (doctorId || isDoctorSelf) fetchDoctorDetails();
    }, [tenantId, doctorId, token, apiBase, isDoctorSelf]);

    if (loading) return <div style={loadingOverlayStyle}>Gathering Doctor Insights...</div>;
    if (error) return <div style={errorStyle}>{error}</div>;
    if (!doctor) return <div>Doctor information not found.</div>;

    const handleBack = () => {
        if (isEditing) {
            setIsEditing(false);
            return;
        }
        if (isAdmin) {
            navigate('/admin/doctor');
        } else if (isSuperAdmin) {
            navigate(`/super-admin/tenants/${tenantId}`);
        } else if (isPatientView) {
            navigate('/booking');
        } else {
            navigate(-1);
        }
    };

    if (isEditing) {
        return <ProfileSection onCancel={() => setIsEditing(false)} />;
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', margin: "0px 30px" }}>
            {/* Header / Back Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="secondary" onClick={handleBack} style={backButtonStyle}>
                        <ArrowLeft size={18} />
                    </Button>
                    {!isAdmin && !isSuperAdmin && !isDoctorSelf && (
                        <div>
                            <h2 style={{ margin: 0, fontWeight: '700' }}>{isPatientView ? 'Doctor Insights' : 'Doctor Profile'}</h2>
                        </div>
                    )}
                </div>

                {isDoctorSelf && (
                    <Button variant="primary" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' , marginTop: '20px'}}>
                        <Edit3 size={18} /> Edit Profile
                    </Button>
                )}

                {isPatientView && (
                    <Button variant="primary" onClick={() => navigate('/booking')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} /> Book Appointment
                    </Button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 3fr', gap: '2.5rem' }}>
                {/* Left Column: Identity */}
                <div style={identitySectionStyle}>
                    <div style={largeAvatarContainer}>
                        <Avatar
                            src={doctor.profilePic}
                            name={doctor.name}
                            size="large"
                            type="doctor"
                            style={{ borderRadius: '24px', border: 'none' }}
                        />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '22px', fontWeight: '700' }}>{doctor.name}</h3>
                        <div style={specializationBadge}>{doctor.specialization}</div>
                    </div>

                    <div style={infoListStyle}>
                        <InfoItem icon={Globe} label="Timezone" value={doctor.timezone} />
                        <InfoItem icon={Timer} label="Slot Duration" value={`${doctor.slotDuration} mins`} />
                        <InfoItem icon={Clock} label="Working Hours" value={`${doctor.workingStartTime} - ${doctor.workingEndTime}`} />
                    </div>
                </div>

                {/* Right Column: Performance & Reviews */}
                <div>
                    <div style={kpiGridStyle}>
                        <DetailKPICard title="Total Sessions" value={doctor.totalAppointments} icon={Calendar} color="#3b82f6" />
                        <DetailKPICard title="Patient Rating" value={doctor.averageRating} icon={Star} color="#f59e0b" suffix="/ 5.0" />
                        <DetailKPICard title="Reviews" value={doctor.totalReviews} icon={MessageSquare} color="#10b981" />
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={sectionCardStyle}>
                            <h4 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <MessageSquare size={20} color="#3b82f6" />
                                Recent Patient Feedback
                            </h4>

                            {doctor.recentReviews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#888', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                    No patient feedback has been recorded for this doctor yet.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {doctor.recentReviews.map(review => (
                                        <div key={review.id} style={reviewCardStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                                <Avatar
                                                    src={review.patientProfilePhoto}
                                                    name={review.patientName}
                                                    size="small"
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{review.patientName}</div>
                                                    <div style={{ fontSize: '11px', color: '#999' }}>{new Date(review.createdAt).toLocaleDateString()}</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                                                    <Star size={14} fill="currentColor" />
                                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{review.rating}</span>
                                                </div>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '1.5', fontStyle: review.feedback ? 'normal' : 'italic' }}>
                                                {review.feedback || 'No written feedback provided.'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
        <Icon size={16} color="#64748b" />
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{value}</div>
        </div>
    </div>
);

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

// Styles
const loadingOverlayStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#666', fontSize: '16px' };
const errorStyle = { backgroundColor: '#fff5f5', color: '#e53e3e', padding: '12px', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #feb2b2' };
const backButtonStyle = { padding: '8px', minWidth: 'auto', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const identitySectionStyle = { backgroundColor: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e5e7eb', alignSelf: 'start' };
const largeAvatarContainer = { width: '160px', height: '160px', borderRadius: '24px', backgroundColor: '#f1f5f9', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };
const largeAvatarImage = { width: '100%', height: '100%', objectFit: 'cover' };
const specializationBadge = { display: 'inline-block', backgroundColor: '#eff6ff', color: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' };
const infoListStyle = { marginTop: '2rem', display: 'flex', flexDirection: 'column' };
const kpiGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' };
const detailKpiCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' };
const sectionCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' };
const reviewCardStyle = { padding: '1.25rem', borderRadius: '10px', border: '1px solid #f1f5f9', backgroundColor: '#fcfcfc' };
const smallAvatarStyle = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' };

export default DoctorDetail;
