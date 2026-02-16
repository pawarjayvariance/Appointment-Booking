import React from 'react';
import BookingPage from './Pages/BookingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Organisms/LoginForm';
import RegisterForm from './components/Organisms/RegisterForm';
import AdminDashboard from './Pages/AdminDashboard';
import DoctorDashboard from './Pages/DoctorDashboard';
import SuperAdminDashboard from './Pages/SuperAdminDashboard';
import UserDashboard from './Pages/UserDashboard';

const AppContent = () => {
    const { isAuthenticated, loading, user, logout } = useAuth();
    const [isRegistering, setIsRegistering] = React.useState(false);
    const [regSuccess, setRegSuccess] = React.useState('');

    if (loading) return <div className="loading-screen">Loading...</div>;

    if (!isAuthenticated) {
        return (
            <div className="app-container">
                <div className="auth-container">
                    {isRegistering ? (
                        <RegisterForm
                            onToggleMode={() => {
                                setIsRegistering(false);
                                setRegSuccess('');
                            }}
                            onSuccess={() => {
                                setIsRegistering(false);
                                setRegSuccess('Registration successful! Please sign in.');
                            }}
                        />
                    ) : (
                        <LoginForm
                            onToggleMode={() => {
                                setIsRegistering(true);
                                setRegSuccess('');
                            }}
                            successMessage={regSuccess}
                        />
                    )}
                </div>
            </div>
        );
    }

    // Role-based rendering
    if (user?.role === 'super_admin') {
        return <SuperAdminDashboard onLogout={logout} />;
    }

    if (user?.role === 'admin') {
        return <AdminDashboard onLogout={logout} />;
    }

    if (user?.role === 'doctor') {
        return <DoctorDashboard onLogout={logout} />;
    }

    // for user (default)
    return <UserDashboard />;
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
