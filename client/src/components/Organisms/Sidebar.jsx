import { Users, Stethoscope, Calendar, TrendingUp, Building } from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange, isSuperAdmin }) => {
    const superAdminTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
        { id: 'tenants', label: 'Tenants', icon: Building },
        { id: 'user', label: 'Global Users', icon: Users },
        { id: 'appointment', label: 'Global Appointments', icon: Calendar },
        { id: 'analytics', label: 'Platform Analytics', icon: TrendingUp },
    ];

    const adminTabs = [
        { id: 'doctor', label: 'Doctors', icon: Stethoscope },
        { id: 'user', label: 'Users', icon: Users },
        { id: 'appointment', label: 'Appointments', icon: Calendar },
        { id: 'performance', label: 'Performance', icon: TrendingUp }
    ];

    const tabs = isSuperAdmin ? superAdminTabs : adminTabs;

    return (
        <div style={sidebarStyle}>
            <div style={sidebarHeaderStyle}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Dashboard</h3>
            </div>
            <nav style={navStyle}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            style={{
                                ...tabButtonStyle,
                                ...(isActive ? activeTabStyle : {})
                            }}
                        >
                            <Icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

// Styles
const sidebarStyle = {
    width: '220px',
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '600px'
};

const sidebarHeaderStyle = {
    padding: '1.5rem 1rem',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: 'white'
};

const navStyle = {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem 0.5rem',
    gap: '0.25rem'
};

const tabButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#555',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%'
};

const activeTabStyle = {
    backgroundColor: '#007bff',
    color: 'white'
};

export default Sidebar;
