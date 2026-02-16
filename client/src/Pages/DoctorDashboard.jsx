import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DoctorSidebar from '../components/Organisms/DoctorSidebar';
import DoctorAppointmentsTable from '../components/Organisms/DoctorAppointmentsTable';
import DoctorSchedule from '../components/Organisms/DoctorSchedule';
import DoctorReviews from '../components/Organisms/DoctorReviews';
import DoctorDetail from './DoctorDetail';
import Button from '../components/Atoms/Button';
import { LogOut, AlertCircle, User } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import UserDetail from './UserDetail';

const DoctorDashboard = () => {
    const { user, doctor, logout, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Derive activeTab from URL
    const activeTab = location.pathname.split('/').pop() || 'appointments';

    const handleTabChange = (tabId) => {
        navigate(`/doctor/${tabId}`);
    };

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

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-inner">
                    <h1>Doctor Dashboard {user?.tenant?.name ? `(${user.tenant.name})` : ''}</h1>
                    <div className="user-profile" onClick={() => handleTabChange('profile')}>
                        <div className="user-avatar-mini">
                            {user?.profilePic ? (
                                <img src={user.profilePic} alt="Avatar" className="avatar-img" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <span>{doctor?.name || user?.name || 'Doctor'}</span>
                        <Button variant="ghost" onClick={(e) => { e.stopPropagation(); logout(); }} className="logout-btn">
                            <LogOut size={18} /> Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <div className="dashboard-main">
                <DoctorSidebar activeTab={activeTab} onTabChange={handleTabChange} />
                <main className="dashboard-content">
                    <Routes>
                        <Route index element={<Navigate to="appointments" replace />} />
                        <Route path="appointments" element={<DoctorAppointmentsTable />} />
                        <Route path="schedule" element={<DoctorSchedule />} />
                        <Route path="reviews" element={<DoctorReviews />} />
                        <Route path="profile" element={<DoctorDetail />} />
                        <Route path="doctors/:doctorId" element={<DoctorDetail />} />
                        <Route path="users/:userId" element={<UserDetail />} />
                        <Route path="*" element={<Navigate to="appointments" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default DoctorDashboard;
