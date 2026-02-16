import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Award, Building, UserCheck } from 'lucide-react';

const PlatformAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/super-admin/analytics', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAnalytics(res.data);
            } catch (err) {
                console.error('Failed to fetch analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [token]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Analyzing platform data...</div>;
    if (!analytics) return <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No analytics data available.</div>;

    return (
        <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: '2rem' }}>Platform Analytics</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>

                {/* Top Tenants Card */}
                <div style={analyticsCardStyle}>
                    <div style={cardHeaderStyle}>
                        <div style={{ ...iconContainerStyle, backgroundColor: '#eff6ff' }}>
                            <Building size={20} color="#3b82f6" />
                        </div>
                        <h3 style={{ margin: 0 }}>Top Performing Tenants</h3>
                    </div>
                    <p style={cardSubtileStyle}>Ranked by total appointment volume</p>

                    <div style={{ marginTop: '1.5rem' }}>
                        {analytics.topTenants.map((tenant, index) => (
                            <div key={tenant.tenantId} style={listItemStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={rankStyle}>{index + 1}</span>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#333' }}>{tenant.name}</div>
                                        <div style={{ fontSize: '11px', color: '#999' }}>ID: {tenant.tenantId}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '700', color: '#3b82f6' }}>{tenant._count.id}</div>
                                    <div style={{ fontSize: '11px', color: '#999' }}>Appointments</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Doctors Card */}
                <div style={analyticsCardStyle}>
                    <div style={cardHeaderStyle}>
                        <div style={{ ...iconContainerStyle, backgroundColor: '#ecfdf5' }}>
                            <Award size={20} color="#10b981" />
                        </div>
                        <h3 style={{ margin: 0 }}>Top Rated Doctors</h3>
                    </div>
                    <p style={cardSubtileStyle}>Highest average ratings across the platform</p>

                    <div style={{ marginTop: '1.5rem' }}>
                        {analytics.topDoctors.map((doctor, index) => (
                            <div key={doctor.doctorId} style={listItemStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ ...rankStyle, backgroundColor: '#ecfdf5', color: '#059669' }}>{index + 1}</span>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#333' }}>{doctor.name}</div>
                                        <div style={{ fontSize: '11px', color: '#999' }}>{doctor.specialization}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '700', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                        {doctor._avg.rating?.toFixed(1) || '0.0'}
                                        <span style={{ fontSize: '12px' }}>★</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#999' }}>{doctor._count.id} Reviews</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Growth Perspective Placeholder */}
                <div style={{ ...analyticsCardStyle, gridColumn: 'span 2' }}>
                    <div style={cardHeaderStyle}>
                        <div style={{ ...iconContainerStyle, backgroundColor: '#fef3c7' }}>
                            <TrendingUp size={20} color="#d97706" />
                        </div>
                        <h3 style={{ margin: 0 }}>Platform Insights</h3>
                    </div>
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#555', marginBottom: '0.5rem' }}>High-Resolution Growth Data</div>
                        <p style={{ color: '#888', maxWidth: '500px', margin: '0 auto' }}>
                            The platform is currently witnessing a steady increase in user acquisition.
                            Aggregated data shows that clinical conversions are highest in the <strong>{analytics.topTenants[0]?.name}</strong> sector.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Styles
const analyticsCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' };
const cardHeaderStyle = { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' };
const cardSubtileStyle = { margin: 0, fontSize: '13px', color: '#666' };
const iconContainerStyle = { padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f1f1' };
const rankStyle = { width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: '700' };

export default PlatformAnalytics;
