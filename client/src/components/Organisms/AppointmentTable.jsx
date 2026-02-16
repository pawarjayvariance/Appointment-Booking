import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../Atoms/Button';
import useDebounce from '../../hooks/useDebounce';

const AppointmentTable = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter Inputs (Immediate State)
    const [userNameInput, setUserNameInput] = useState('');
    const [userEmailInput, setUserEmailInput] = useState('');
    const [doctorNameInput, setDoctorNameInput] = useState('');
    const [dateInput, setDateInput] = useState('');

    // Debounced Filters
    const debouncedUserName = useDebounce(userNameInput, 300);
    const debouncedUserEmail = useDebounce(userEmailInput, 300);
    const debouncedDoctorName = useDebounce(doctorNameInput, 300);
    const debouncedDate = useDebounce(dateInput, 300);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const token = localStorage.getItem('token');

    // Reset to page 1 when actual filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedUserName, debouncedUserEmail, debouncedDoctorName, debouncedDate]);

    // Fetch appointments with filters
    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: 10
                });

                if (debouncedUserName) params.append('userName', debouncedUserName);
                if (debouncedUserEmail) params.append('userEmail', debouncedUserEmail);
                if (debouncedDoctorName) params.append('doctorName', debouncedDoctorName);
                if (debouncedDate) params.append('date', debouncedDate);

                const res = await axios.get(
                    `http://localhost:5000/api/admin/appointments?${params}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setAppointments(res.data.appointments);
                setTotalPages(res.data.pagination.totalPages);
                setTotalCount(res.data.pagination.totalCount);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch appointments');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [currentPage, debouncedUserName, debouncedUserEmail, debouncedDoctorName, debouncedDate, token]);

    // Handlers
    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
    };

    // Format date and time
    const formatDateTime = (timeSlot) => {
        if (!timeSlot) return 'N/A';
        const date = new Date(timeSlot.startTime);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ flex: 1, padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Appointment Management</h2>

            {/* Results Count */}
            <div style={{ marginBottom: '1rem', color: '#666', fontSize: '14px' }}>
                Showing {appointments.length} of {totalCount} appointments
            </div>

            {/* Loading State */}


            {/* Error State */}
            {error && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#fee',
                    color: '#c33',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {/* Table */}
            {!error && (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={tableHeaderStyle}>#</th>
                                    <th style={tableHeaderStyle}>User Name</th>
                                    <th style={tableHeaderStyle}>User Email</th>
                                    <th style={tableHeaderStyle}>Doctor Name</th>
                                    <th style={tableHeaderStyle}>Appointment Date & Time</th>
                                </tr>
                                {/* Filter Row */}
                                <tr style={{ backgroundColor: '#fff' }}>
                                    <th style={filterCellStyle}></th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={userNameInput}
                                            onChange={handleInputChange(setUserNameInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={userEmailInput}
                                            onChange={handleInputChange(setUserEmailInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={doctorNameInput}
                                            onChange={handleInputChange(setDoctorNameInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="date"
                                            value={dateInput}
                                            onChange={handleInputChange(setDateInput)}
                                            style={filterInputStyle}
                                        />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                            Loading appointments...
                                        </td>
                                    </tr>
                                ) : appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{
                                            textAlign: 'center',
                                            padding: '3rem',
                                            color: '#666',
                                            backgroundColor: '#f9f9f9'
                                        }}>
                                            No appointments found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((appointment, index) => (
                                        <tr key={appointment.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={tableCellStyle}>
                                                {(currentPage - 1) * 10 + index + 1}
                                            </td>
                                            <td style={tableCellStyle}>{appointment.user.name}</td>
                                            <td style={tableCellStyle}>{appointment.user.email}</td>
                                            <td style={tableCellStyle}>{appointment.doctor.name}</td>
                                            <td style={tableCellStyle}>
                                                {formatDateTime(appointment.timeSlot)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '1rem',
                            marginTop: '2rem'
                        }}>
                            <Button
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                disabled={currentPage === 1}
                                variant="secondary"
                            >
                                <ChevronLeft size={18} /> Previous
                            </Button>

                            <span style={{ color: '#666', fontSize: '14px' }}>
                                Page {currentPage} of {totalPages}
                            </span>

                            <Button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage === totalPages}
                                variant="secondary"
                            >
                                Next <ChevronRight size={18} />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div >
    );
};

// Styles
const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    overflow: 'hidden'
};

const tableHeaderStyle = {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '14px',
    color: '#333',
    borderBottom: '2px solid #ddd'
};

const filterCellStyle = {
    padding: '8px 12px',
    borderBottom: '1px solid #ddd'
};

const filterInputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px'
};

const tableCellStyle = {
    padding: '12px',
    fontSize: '14px',
    color: '#555'
};

export default AppointmentTable;
