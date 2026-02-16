import React from 'react';
import { LayoutDashboard, Calendar, Users, User, Star } from 'lucide-react';

const DoctorSidebar = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'appointments', label: 'My Appointments', icon: Calendar },
        { id: 'schedule', label: 'My Schedule', icon: LayoutDashboard },
        // { id: 'patients', label: 'Patients', icon: Users },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'profile', label: 'My Profile', icon: User }
    ];

    return (
        <div className="dashboard-sidebar">
            <div className="sidebar-header">
                <h3>Doctor Panel</h3>
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
        </div>
    );
};

export default DoctorSidebar;
