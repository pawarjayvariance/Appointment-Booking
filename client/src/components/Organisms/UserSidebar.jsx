import React from 'react';
import { Calendar, Clock, User } from 'lucide-react';

const UserSidebar = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'booking', label: 'Book Appointment', icon: Calendar },
        { id: 'appointments', label: 'My Appointments', icon: Clock },
        { id: 'profile', label: 'My Profile', icon: User },
    ];

    return (
        <div className="dashboard-sidebar">
            <div className="sidebar-header">
                <h3>User Panel</h3>
            </div>
            <nav className="sidebar-nav">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            className={`sidebar-tab ${isActive ? 'active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                        >
                            <Icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
            <div className="sidebar-footer">
                <div className="user-info-mini">
                    {/* Placeholder for future profile quick-access */}
                </div>
            </div>
        </div>
    );
};

export default UserSidebar;
