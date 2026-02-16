import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { ChevronLeft, ChevronRight, AlertCircle, Clock, Star } from 'lucide-react';
import Button from '../Atoms/Button';
import Avatar from '../Atoms/Avatar';
import ReviewModal from './ReviewModal';
import './UserAppointmentsTable.css';

const UserAppointmentsTable = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Review State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(
                    `/user/appointments/history?page=${currentPage}&limit=10`
                );

                setAppointments(res.data.data);
                setTotalPages(res.data.totalPages);
                setTotalRecords(res.data.totalRecords);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch appointment history');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [currentPage, token]);

    const formatDateTime = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return { dateStr, timeStr, start };
    };

    const getStatus = (startTime) => {
        return new Date(startTime) > new Date() ? 'Upcoming' : 'Completed';
    };

    const handleReviewClick = (doctorId, doctorName) => {
        setSelectedDoctor({ id: doctorId, name: doctorName });
        setIsReviewModalOpen(true);
    };

    return (
        <div className="user-appointments-container">
            <div className="table-header-section">
                <h2>Appointment History</h2>
                <div className="records-stat">
                    Total: <strong>{totalRecords}</strong> records
                </div>
            </div>

            {error && <div className="table-error"><AlertCircle size={18} /> {error}</div>}

            <div className="appointments-table-wrapper">
                <table className="appointments-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Doctor Name</th>
                            <th>Date</th>
                            <th>Time Slot</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="table-loading">
                                    <span className="loading-spinner"></span> Loading history...
                                </td>
                            </tr>
                        ) : appointments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="table-empty">
                                    No appointment history found.
                                </td>
                            </tr>
                        ) : (
                            appointments.map((apt, index) => {
                                const { dateStr, timeStr, start } = formatDateTime(apt.timeSlot.startTime, apt.timeSlot.endTime);
                                const status = getStatus(start);
                                return (
                                    <tr key={apt.id}>
                                        <td>{(currentPage - 1) * 10 + index + 1}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <Avatar src={apt.doctor.user?.profilePic} name={apt.doctor.name} size="small" type="doctor" />
                                                <strong>{apt.doctor.name}</strong>
                                            </div>
                                        </td>
                                        <td>{dateStr}</td>
                                        <td>{timeStr}</td>
                                        <td>
                                            <span className={`status-badge ${status.toLowerCase()}`}>
                                                {status === 'Upcoming' ? <Clock size={12} /> : null}
                                                {status}
                                            </span>
                                        </td>
                                        <td>
                                            {status === 'Completed' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="review-btn"
                                                    onClick={() => handleReviewClick(apt.doctorId, apt.doctor.name)}
                                                >
                                                    <Star size={14} /> Review
                                                </Button>
                                            )}
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

            {selectedDoctor && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    doctor={selectedDoctor}
                    onReviewSubmitted={() => {
                        console.log('Review submitted!');
                    }}
                />
            )}
        </div>
    );
};

export default UserAppointmentsTable;
