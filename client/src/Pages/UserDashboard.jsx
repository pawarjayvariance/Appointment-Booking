import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserSidebar from '../components/Organisms/UserSidebar';
import BookingPage from './BookingPage';
import ProfileSection from '../components/Organisms/ProfileSection';
import UserAppointmentsTable from '../components/Organisms/UserAppointmentsTable';
import Button from '../components/Atoms/Button';
import { LogOut, User } from 'lucide-react';

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('booking');

    const renderContent = () => {
        switch (activeTab) {
            case 'booking':
                return <BookingPage />;
            case 'appointments':
                return <UserAppointmentsTable />;
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
                    <h1>Patient Portal {user?.tenant?.name ? `(${user.tenant.name})` : ''}</h1>
                    <div className="user-profile" onClick={() => setActiveTab('profile')}>
                        <div className="user-avatar-mini">
                            {user?.profilePic ? (
                                <img src={user.profilePic} alt="Avatar" className="avatar-img" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <span>Welcome, {user?.name || 'User'}</span>
                        <Button variant="ghost" onClick={(e) => { e.stopPropagation(); logout(); }} className="logout-btn">
                            <LogOut size={18} /> Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <div className="dashboard-main">
                <UserSidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <main className="dashboard-content">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default UserDashboard;
