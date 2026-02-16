import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedDoctor = localStorage.getItem('doctor');
        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
                if (storedDoctor) {
                    setDoctor(JSON.parse(storedDoctor));
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

    const login = (userData, userToken, doctorData = null) => {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        if (doctorData) {
            localStorage.setItem('doctor', JSON.stringify(doctorData));
        }
        setToken(userToken);
        setUser(userData);
        setDoctor(doctorData);
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
    };

    return (
        <AuthContext.Provider value={{ user, doctor, token, login, logout, updateUser, isAuthenticated: !!token, loading, role: user?.role }}>
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
