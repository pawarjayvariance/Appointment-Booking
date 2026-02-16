import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DoctorSidebar from '../components/Organisms/DoctorSidebar';
import DoctorAppointmentsTable from '../components/Organisms/DoctorAppointmentsTable';
import DoctorSchedule from '../components/Organisms/DoctorSchedule';
import DoctorReviews from '../components/Organisms/DoctorReviews';
import ProfileSection from '../components/Organisms/ProfileSection';
import Button from '../components/Atoms/Button';
import { LogOut, AlertCircle, User } from 'lucide-react';

const DoctorDashboard = () => {
    const { user, doctor, logout, role } = useAuth();
    const [activeTab, setActiveTab] = useState('appointments');

    if (role && role !== 'doctor' && role !== 'admin') {
        return (
            <div className="access-denied" style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1rem' }}>
                <AlertCircle size={48} color="#ef4444" />
                <h2>Access Denied</h2>
                <p>This panel is restricted to doctors only.</p>
                <Button onClick={() => window.location.href = '/'}>Go Back Home</Button>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'appointments':
                return <DoctorAppointmentsTable />;
            case 'schedule':
                return <DoctorSchedule />;
            // case 'patients':
            //     return <div className="tab-content"><h2>Patients Content</h2><p>View and manage patient records here.</p></div>;
            case 'reviews':
                return <DoctorReviews />;
            case 'profile':
                return <ProfileSection />;
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-inner">
                    <h1>Doctor Dashboard {user?.tenant?.name ? `(${user.tenant.name})` : ''}</h1>
                    <div className="user-profile" onClick={() => setActiveTab('profile')}>
                        <div className="user-avatar-mini">
                            {user?.profilePic ? (
                                <img src={user.profilePic} alt="Avatar" className="avatar-img" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <span>Dr. {doctor?.name || user?.name || 'Doctor'}</span>
                        <Button variant="ghost" onClick={(e) => { e.stopPropagation(); logout(); }} className="logout-btn">
                            <LogOut size={18} /> Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <div className="dashboard-main">
                <DoctorSidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <main className="dashboard-content">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default DoctorDashboard;
