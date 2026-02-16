import React, { useState } from 'react';
import Button from '../components/Atoms/Button';
import Sidebar from '../components/Organisms/Sidebar';
import DoctorTable from '../components/Organisms/DoctorTable';
import UserTable from '../components/Organisms/UserTable';
import AppointmentTable from '../components/Organisms/AppointmentTable';
import DoctorPerformance from '../components/Organisms/DoctorPerformance';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = ({ onLogout }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('doctor');

    const renderContent = () => {
        switch (activeTab) {
            case 'doctor':
                return <DoctorTable />;
            case 'user':
                return <UserTable />;
            case 'appointment':
                return <AppointmentTable />;
            case 'performance':
                return <DoctorPerformance />;
            default:
                return <DoctorTable />;
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={headerContentStyle}>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>
                        Admin Dashboard {user?.tenant?.name ? `(${user.tenant.name})` : ''}
                    </h1>
                    <Button onClick={onLogout} variant="secondary">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <LogOut size={18} /> Sign Out
                        </span>
                    </Button>
                </div>
            </div>

            {/* Main Layout */}
            <div style={mainLayoutStyle}>
                {/* Sidebar */}
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Content Area */}
                <div style={contentAreaStyle}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// Styles
const headerStyle = {
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    height: '60px', // Fixed height
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    flexShrink: 0
};

const headerContentStyle = {
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%'
};

const mainLayoutStyle = {
    display: 'flex',
    backgroundColor: 'white',
    flex: 1,
    overflow: 'hidden'
};

const contentAreaStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    padding: '2rem'
};

export default AdminDashboard;
