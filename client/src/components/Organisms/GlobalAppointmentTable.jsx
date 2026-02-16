import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Filter } from 'lucide-react';

const GlobalAppointmentTable = () => {
    const [appointments, setAppointments] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ tenantId: '', status: '' });
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/super-admin/tenants?limit=100', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTenants(res.data.tenants);
            } catch (err) { console.error(err); }
        };
        fetchTenants();
    }, [token]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                ...filter,
                page: page.toString()
            }).toString();

            const res = await axios.get(`http://localhost:5000/api/super-admin/appointments?${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(res.data.appointments);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to fetch appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [filter, page]);

    return (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Platform Appointment Monitor</h2>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid #eee', paddingRight: '1rem' }}>
                        <Filter size={14} color="#777" />
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Filters:</span>
                    </div>

                    <select
                        style={filterSelectStyle}
                        value={filter.tenantId}
                        onChange={e => { setFilter({ ...filter, tenantId: e.target.value }); setPage(1); }}
                    >
                        <option value="">All Tenants</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={{ backgroundColor: '#fcfcfc', borderBottom: '2px solid #f1f1f1' }}>
                            <th style={tableHeaderStyle}>Patient / User</th>
                            <th style={tableHeaderStyle}>Doctor / Staff</th>
                            <th style={tableHeaderStyle}>Tenant / Clinic</th>
                            <th style={tableHeaderStyle}>Appointment Date</th>
                            <th style={tableHeaderStyle}>Booked At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading appointments...</td></tr>
                        ) : appointments.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No appointments found.</td></tr>
                        ) : appointments.map(appt => (
                            <tr key={appt.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                <td style={tableCellStyle}>
                                    <div style={{ fontWeight: '600', color: '#333' }}>{appt.user?.name}</div>
                                    <div style={{ fontSize: '12px', color: '#777' }}>{appt.user?.email}</div>
                                </td>
                                <td style={tableCellStyle}>
                                    <div style={{ fontWeight: '500', color: '#555' }}>Dr. {appt.doctor?.name}</div>
                                </td>
                                <td style={tableCellStyle}>
                                    <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{appt.tenant?.name}</div>
                                </td>
                                <td style={tableCellStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} color="#777" />
                                        <span>
                                            {formatDate(appt.timeSlot?.date)} at {formatTime(appt.timeSlot?.startTime)}
                                        </span>
                                    </div>
                                </td>
                                <td style={tableCellStyle}>
                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                        {new Date(appt.createdAt).toLocaleString()}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={paginationStyle}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    style={pageButtonStyle}
                >Previous</button>
                <span style={{ fontSize: '14px', color: '#666' }}>Page {page} of {pagination.totalPages || 1}</span>
                <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    style={pageButtonStyle}
                >Next</button>
            </div>
        </div>
    );
};

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (timeStr) => {
    return new Date(timeStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeaderStyle = { padding: '16px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777', fontWeight: '700' };
const tableCellStyle = { padding: '16px', fontSize: '14px', color: '#444' };
const filterSelectStyle = { padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', outline: 'none', backgroundColor: '#fcfcfc' };
const paginationStyle = { marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' };
const pageButtonStyle = { padding: '6px 12px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px' };

export default GlobalAppointmentTable;
