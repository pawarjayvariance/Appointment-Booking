import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Search, Calendar, Mail, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../Atoms/Button';
import Avatar from '../Atoms/Avatar';
import useDebounce from '../../hooks/useDebounce';
import './DoctorAppointmentsTable.css';

const DoctorAppointmentsTable = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter Inputs
    const [patientNameInput, setPatientNameInput] = useState('');
    const [patientEmailInput, setPatientEmailInput] = useState('');
    const [dateInput, setDateInput] = useState('');

    // Debounced Filters
    const debouncedName = useDebounce(patientNameInput, 400);
    const debouncedEmail = useDebounce(patientEmailInput, 400);
    const debouncedDate = useDebounce(dateInput, 400);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const token = localStorage.getItem('token');

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedName, debouncedEmail, debouncedDate]);

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: 10
                });

                if (debouncedName) params.append('userName', debouncedName);
                if (debouncedEmail) params.append('userEmail', debouncedEmail);
                if (debouncedDate) params.append('date', debouncedDate);

                const res = await axios.get(
                    `http://localhost:5000/api/doctor/appointments?${params}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setAppointments(res.data.data);
                setTotalPages(res.data.totalPages);
                setTotalRecords(res.data.totalRecords);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch your appointments');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [currentPage, debouncedName, debouncedEmail, debouncedDate, token]);

    const formatDateTime = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return { dateStr, timeStr };
    };

    return (
        <div className="doctor-appointments-container">
            <div className="table-header-section">
                <h2>My Appointments</h2>
                <div className="records-stat">
                    Total: <strong>{totalRecords}</strong> appointments
                </div>
            </div>

            {error && <div className="table-error">{error}</div>}

            <div className="appointments-table-wrapper">
                <table className="appointments-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Patient Name</th>
                            <th>Email</th>
                            <th>Date</th>
                            <th>Time Slot</th>
                            <th>Status</th>
                        </tr>
                        <tr className="filter-row">
                            <th></th>
                            <th>
                                <div className="filter-input-group">
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        placeholder="Name..."
                                        className="filter-input"
                                        value={patientNameInput}
                                        onChange={(e) => setPatientNameInput(e.target.value)}
                                    />
                                </div>
                            </th>
                            <th>
                                <div className="filter-input-group">
                                    <Mail size={14} />
                                    <input
                                        type="text"
                                        placeholder="Email..."
                                        className="filter-input"
                                        value={patientEmailInput}
                                        onChange={(e) => setPatientEmailInput(e.target.value)}
                                    />
                                </div>
                            </th>
                            <th>
                                <div className="filter-input-group">
                                    <Calendar size={14} />
                                    <input
                                        type="date"
                                        className="filter-input date-filter"
                                        value={dateInput}
                                        onChange={(e) => setDateInput(e.target.value)}
                                    />
                                </div>
                            </th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="table-loading">
                                    <span className="loading-spinner"></span> Loading appointments...
                                </td>
                            </tr>
                        ) : appointments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="table-empty">
                                    No appointments found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            appointments.map((apt, index) => {
                                const { dateStr, timeStr } = formatDateTime(apt.timeSlot.startTime, apt.timeSlot.endTime);
                                return (
                                    <tr key={apt.id}>
                                        <td>{(currentPage - 1) * 10 + index + 1}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <Avatar src={apt.user.profilePic} name={apt.user.name} size="small" />
                                                <Link
                                                    to={`/doctor/users/${apt.user.id}`}
                                                    style={{ textDecoration: 'none', color: '#007bff', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    {apt.user.name}
                                                </Link>
                                            </div>
                                        </td>
                                        <td>{apt.user.email}</td>
                                        <td>{dateStr}</td>
                                        <td>{timeStr}</td>
                                        <td>
                                            <span className="status-badge">Confirmed</span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination-controls">
                    <Button
                        variant="secondary"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loading}
                    >
                        <ChevronLeft size={18} /> Previous
                    </Button>
                    <span className="page-info">
                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    </span>
                    <Button
                        variant="secondary"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || loading}
                    >
                        Next <ChevronRight size={18} />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default DoctorAppointmentsTable;
