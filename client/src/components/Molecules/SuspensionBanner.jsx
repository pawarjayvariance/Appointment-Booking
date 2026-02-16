import React from 'react';
import { AlertCircle, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../Atoms/Button';

const SuspensionBanner = () => {
    const { isSuspended, user, logout } = useAuth();

    if (!isSuspended || user?.role === 'super_admin') return null;

    return (
        <div style={bannerStyle}>
            <div style={contentStyle}>
                <AlertCircle size={24} color="#dc2626" />
                <div style={messageContainerStyle}>
                    <h3 style={titleStyle}>Account Suspended</h3>
                    <p style={messageStyle}>
                        Your account is temporarily suspended because your tenant is inactive.
                        Please contact the Super Admin for further details.
                    </p>
                    <div style={{ marginTop: '0.75rem' }}>
                        <Button
                            variant="primary"
                            onClick={logout}
                            style={{ backgroundColor: '#ef4444', borderColor: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            <LogOut size={16} />
                            Sign Out
                        </Button>
                    </div>
                </div>
                <div style={iconContainerStyle}>
                    <Lock size={20} color="#dc2626" />
                </div>
            </div>
            {/* Optional: Overlay to disable interaction with the rest of the app */}
            <style>
                {`
                    /* Disable pointer events on the rest of the app when suspended */
                    /* Note: We apply this globally or to a specific wrapper in App.jsx */
                    body.suspended {
                        overflow: hidden;
                    }
                    .app-content-wrapper {
                        pointer-events: none;
                        opacity: 0.6;
                        filter: grayscale(100%);
                    }
                `}
            </style>
        </div>
    );
};

// Styles
const bannerStyle = {
    position: 'fixed',
    top: '30%',
    left: 0,
    right: 0,
    backgroundColor: '#fef2f2',
    borderBottom: '1px solid #fee2e2',
    color: '#991b1b',
    padding: '4rem',
    zIndex: 9999, // Ensure it's on top of everything
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'center',
};

const contentStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    maxWidth: '800px',
    width: '100%',
};

const messageContainerStyle = {
    flex: 1,
};

const titleStyle = {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#b91c1c',
};

const messageStyle = {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#7f1d1d',
};

const iconContainerStyle = {
    padding: '8px',
    backgroundColor: '#fee2e2',
    borderRadius: '50%',
};

export default SuspensionBanner;
