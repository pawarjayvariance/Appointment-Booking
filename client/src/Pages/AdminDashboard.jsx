import React, { useState } from 'react';
import Button from '../components/Atoms/Button';
import Sidebar from '../components/Organisms/Sidebar';
import DoctorTable from '../components/Organisms/DoctorTable';
import UserTable from '../components/Organisms/UserTable';
import AppointmentTable from '../components/Organisms/AppointmentTable';
import DoctorPerformance from '../components/Organisms/DoctorPerformance';
import Avatar from '../components/Atoms/Avatar';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import UserDetail from './UserDetail';
import DoctorDetail from './DoctorDetail';

const AdminDashboard = ({ onLogout }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Derive activeTab from URL
    const activeTab = location.pathname.split('/').pop() || 'doctor';

    const handleTabChange = (tabId) => {
        navigate(`/admin/${tabId}`);
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={headerContentStyle}>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>
                        Admin Dashboard {user?.tenant?.name ? `(${user.tenant.name})` : ''}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Avatar src={user?.profilePhoto} name={user?.name} size="small" />
                            <span style={{ fontWeight: '500', color: '#333' }}>{user?.name}</span>
                        </div>
                        <Button onClick={onLogout} variant="secondary">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LogOut size={18} /> Sign Out
                            </span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div style={mainLayoutStyle}>
                {/* Sidebar */}
                <Sidebar activeTab={activeTab} onTabChange={handleTabChange} isSuperAdmin={false} />

                {/* Content Area */}
                <div style={contentAreaStyle}>
                    <Routes>
                        <Route index element={<Navigate to="doctor" replace />} />
                        <Route path="doctor" element={<DoctorTable />} />
                        <Route path="user" element={<UserTable />} />
                        <Route path="appointment" element={<AppointmentTable />} />
                        <Route path="performance" element={<DoctorPerformance />} />
                        <Route path="users/:userId" element={<UserDetail />} />
                        <Route path="doctors/:doctorId" element={<DoctorDetail />} />
                        <Route path="*" element={<Navigate to="doctor" replace />} />
                    </Routes>
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
