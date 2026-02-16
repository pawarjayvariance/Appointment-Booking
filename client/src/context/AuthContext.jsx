import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [isSuspended, setIsSuspended] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedDoctor = localStorage.getItem('doctor');
        if (storedUser && token) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                if (storedDoctor) {
                    setDoctor(JSON.parse(storedDoctor));
                }
                // Check suspension status from stored user data
                if (parsedUser.tenant?.status === 'suspended' && parsedUser.role !== 'super_admin') {
                    setIsSuspended(true);
                }
            } catch (e) {
                console.error('Failed to parse stored user data', e);
                localStorage.removeItem('user');
                localStorage.removeItem('doctor');
                localStorage.removeItem('token');
                setToken(null);
            }
        }
        setLoading(false);
    }, [token]);

    // Listen for suspension events from API interceptor
    useEffect(() => {
        const handleSuspension = () => {
            setIsSuspended(true);
        };

        window.addEventListener('tenant-suspended', handleSuspension);
        return () => {
            window.removeEventListener('tenant-suspended', handleSuspension);
        };
    }, []);

    const login = (userData, userToken, doctorData = null) => {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        if (doctorData) {
            localStorage.setItem('doctor', JSON.stringify(doctorData));
        }
        setToken(userToken);
        setUser(userData);
        setDoctor(doctorData);

        if (userData.tenant?.status === 'suspended' && userData.role !== 'super_admin') {
            setIsSuspended(true);
        } else {
            setIsSuspended(false);
        }
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);

        // If it's a doctor and name changed, also update doctor object if applicable
        if (user?.role === 'doctor' && updatedData.name && doctor) {
            const newDoctor = { ...doctor, name: updatedData.name };
            localStorage.setItem('doctor', JSON.stringify(newDoctor));
            setDoctor(newDoctor);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('doctor');
        setToken(null);
        setUser(null);
        setDoctor(null);
        setIsSuspended(false);
    };

    return (
        <AuthContext.Provider value={{ user, doctor, token, login, logout, updateUser, isAuthenticated: !!token, loading, role: user?.role, isSuspended }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
