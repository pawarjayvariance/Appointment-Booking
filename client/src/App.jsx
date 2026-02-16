import React from 'react';
import BookingPage from './Pages/BookingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Organisms/LoginForm';
import RegisterForm from './components/Organisms/RegisterForm';
import AdminDashboard from './Pages/AdminDashboard';
import DoctorDashboard from './Pages/DoctorDashboard';
import SuperAdminDashboard from './Pages/SuperAdminDashboard';
import UserDashboard from './Pages/UserDashboard';
import DoctorDetail from './Pages/DoctorDetail';
import SuspensionBanner from './components/Molecules/SuspensionBanner';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const AppContent = () => {
    const { isAuthenticated, loading, user, logout, isSuspended } = useAuth();
    const [regSuccess, setRegSuccess] = React.useState('');

    if (loading) return <div className="loading-screen">Loading...</div>;

    if (!isAuthenticated) {
        return (
            <div className="app-container">
                <div className="auth-container">
                    <Routes>
                        <Route path="/login" element={
                            <LoginForm
                                onToggleMode={() => setRegSuccess('')}
                                successMessage={regSuccess}
                            />
                        } />
                        <Route path="/register" element={
                            <RegisterForm
                                onToggleMode={() => setRegSuccess('')}
                                onSuccess={() => setRegSuccess('Registration successful! Please sign in.')}
                            />
                        } />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </div>
            </div>
        );
    }

    // Role-based rendering
    return (
        <>
            <SuspensionBanner />
            <div className={`app-content-wrapper ${isSuspended && user?.role !== 'super_admin' ? 'suspended-content' : ''}`}>
                <Routes>
                    {user?.role === 'super_admin' && (
                        <>
                            <Route path="/super-admin/*" element={<SuperAdminDashboard onLogout={logout} />} />
                            <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
                        </>
                    )}
                    {user?.role === 'admin' && (
                        <>
                            <Route path="/admin/*" element={<AdminDashboard onLogout={logout} />} />
                            <Route path="*" element={<Navigate to="/admin" replace />} />
                        </>
                    )}
                    {user?.role === 'doctor' && (
                        <>
                            <Route path="/doctor/*" element={<DoctorDashboard onLogout={logout} />} />
                            <Route path="*" element={<Navigate to="/doctor" replace />} />
                        </>
                    )}
                    {user?.role === 'user' && (
                        <>
                            <Route path="/dashboard" element={<UserDashboard />} />
                            <Route path="/booking" element={<BookingPage />} />
                            <Route path="/doctor/:doctorId" element={<DoctorDetail />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </>
                    )}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
            <style>{`
                .suspended-content {
                    pointer-events: none;
                    opacity: 0.5;
                    filter: grayscale(100%);
                    user-select: none;
                }
            `}</style>
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
