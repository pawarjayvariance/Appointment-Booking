import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '../components/Atoms/Button';
import Sidebar from '../components/Organisms/Sidebar';
import TenantTable from '../components/Organisms/TenantTable';
import GlobalUserTable from '../components/Organisms/GlobalUserTable';
import GlobalAppointmentTable from '../components/Organisms/GlobalAppointmentTable';
import PlatformAnalytics from '../components/Organisms/PlatformAnalytics';
import { LogOut, Layout, Building2, Users, Calendar, Activity, Star } from 'lucide-react';

const SuperAdminDashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await axios.get('http://localhost:5000/api/super-admin/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (err) {
                console.error('Failed to fetch platform stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    const renderDashboardOverview = () => {
        if (loading) return <div style={loadingOverlayStyle}>Loading Platform Performance...</div>;
        if (!stats) return <div>Stats unavailable</div>;

        return (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <h2 style={{ marginBottom: '2rem', fontWeight: '700' }}>Platform Overview</h2>

                <div style={kpiGridStyle}>
                    <KPICard title="Total Tenants" value={stats.totalTenants} icon={Building2} color="#3b82f6" subtitle={`${stats.activeTenants} Active / ${stats.suspendedTenants} Terminated`} />
                    <KPICard title="Platform Users" value={stats.totalUsers} icon={Users} color="#8b5cf6" />
                    <KPICard title="Appointments" value={stats.totalAppointments} icon={Calendar} color="#10b981" />
                    <KPICard title="Avg. Rating" value={stats.platformAverageRating} icon={Star} color="#f59e0b" suffix="/ 5.0" />
                </div>

                <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div style={chartPlaceholderStyle}>
                        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Activity size={18} color="#3b82f6" />
                            System Health & Activity
                        </h4>
                        <div style={{ height: '240px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                            Interactive Platform Growth Graph
                        </div>
                    </div>

                    <div style={quickActionsStyle}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>Quick Actions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <Button variant="secondary" onClick={() => setActiveTab('tenants')} style={actionButtonStyle}>Manage All Tenants</Button>
                            <Button variant="secondary" onClick={() => setActiveTab('user')} style={actionButtonStyle}>Review Global Users</Button>
                            <Button variant="outline" style={actionButtonStyle}>Platform Configuration</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return renderDashboardOverview();
            case 'tenants':
                return <TenantTable />;
            case 'user':
                return <GlobalUserTable />;
            case 'appointment':
                return <GlobalAppointmentTable />;
            case 'analytics':
                return <PlatformAnalytics />;
            default:
                return renderDashboardOverview();
        }
    };

    return (
        <div style={pageContainerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={headerContentStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={logoIconStyle}><Layout size={24} color="white" /></div>
                        <div>
                            <h1 style={titleStyle}>Analytics</h1>
                            <span style={subtitleStyle}>Super Admin Control Panel</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={statusDotContainer}>
                            <div style={statusDot}></div>
                            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>Platform Operational</span>
                        </div>
                        <Button onClick={onLogout} variant="secondary" style={logoutButtonStyle}>
                            <LogOut size={16} /> Sign Out
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div style={mainLayoutStyle}>
                {/* Sidebar */}
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isSuperAdmin={true} />

                {/* Content Area */}
                <div style={contentAreaStyle}>
                    <div style={contentWrapperStyle}>
                        {renderContent()}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
};

const KPICard = ({ title, value, icon: Icon, color, subtitle, suffix }) => (
    <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>{title}</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: '700', color: '#111' }}>{value}</span>
            {suffix && <span style={{ fontSize: '14px', color: '#999' }}>{suffix}</span>}
        </div>
        {subtitle && <div style={{ fontSize: '12px', color: '#888', marginTop: '0.5rem' }}>{subtitle}</div>}
    </div>
);

// Styles
const pageContainerStyle = { height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f9fafb' };
const headerStyle = { backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', height: '72px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', zIndex: 10, flexShrink: 0 };
const headerContentStyle = { padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' };
const logoIconStyle = { backgroundColor: '#3b82f6', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const titleStyle = { margin: 0, fontSize: '18px', fontWeight: '800', color: '#111', letterSpacing: '-0.02em' };
const subtitleStyle = { fontSize: '12px', color: '#6b7280', fontWeight: '500' };

const statusDotContainer = { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '20px' };
const statusDot = { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' };
const logoutButtonStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', fontWeight: '600' };

const mainLayoutStyle = { display: 'flex', flex: 1, overflow: 'hidden' };
const contentAreaStyle = { flex: 1, overflow: 'auto', padding: '2.5rem' };
const contentWrapperStyle = { maxWidth: '1200px', margin: '0 auto' };

const kpiGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' };
const kpiCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' };

const chartPlaceholderStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' };
const quickActionsStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' };
const actionButtonStyle = { width: '100%', justifyContent: 'flex-start', padding: '10px 15px', fontSize: '14px' };
const loadingOverlayStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#666', fontSize: '16px' };

export default SuperAdminDashboard;
