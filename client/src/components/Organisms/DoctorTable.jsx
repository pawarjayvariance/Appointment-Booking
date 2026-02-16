import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../Atoms/Button';
import useDebounce from '../../hooks/useDebounce';

const DoctorTable = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter Inputs (Immediate State)
    const [nameInput, setNameInput] = useState('');
    const [specializationInput, setSpecializationInput] = useState('');
    const [timezoneInput, setTimezoneInput] = useState('');
    const [slotDurationInput, setSlotDurationInput] = useState('');
    const [workingStartInput, setWorkingStartInput] = useState('');
    const [workingEndInput, setWorkingEndInput] = useState('');

    // Debounced Filters
    const debouncedName = useDebounce(nameInput, 300);
    const debouncedSpecialization = useDebounce(specializationInput, 300);
    const debouncedTimezone = useDebounce(timezoneInput, 300);
    const debouncedSlotDuration = useDebounce(slotDurationInput, 300);
    const debouncedWorkingStart = useDebounce(workingStartInput, 300);
    const debouncedWorkingEnd = useDebounce(workingEndInput, 300);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const token = localStorage.getItem('token');

    // Reset to page 1 when actual filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedName, debouncedSpecialization, debouncedTimezone, debouncedSlotDuration, debouncedWorkingStart, debouncedWorkingEnd]);

    // Fetch doctors with filters
    useEffect(() => {
        const fetchDoctors = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: 10
                });

                if (debouncedName) params.append('name', debouncedName);
                if (debouncedSpecialization) params.append('specialization', debouncedSpecialization);
                if (debouncedTimezone) params.append('timezone', debouncedTimezone);
                if (debouncedSlotDuration) params.append('slotDuration', debouncedSlotDuration);
                if (debouncedWorkingStart) params.append('workingStart', debouncedWorkingStart);
                if (debouncedWorkingEnd) params.append('workingEnd', debouncedWorkingEnd);

                const res = await axios.get(
                    `http://localhost:5000/api/admin/doctors?${params}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setDoctors(res.data.doctors);
                setTotalPages(res.data.pagination.totalPages);
                setTotalCount(res.data.pagination.totalCount);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch doctors');
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, [currentPage, debouncedName, debouncedSpecialization, debouncedTimezone, debouncedSlotDuration, debouncedWorkingStart, debouncedWorkingEnd, token]);

    // Handlers
    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
    };

    return (
        <div style={{ flex: 1, padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Doctor Management</h2>

            {/* Results Count */}
            <div style={{ marginBottom: '1rem', color: '#666', fontSize: '14px' }}>
                Showing {doctors.length} of {totalCount} doctors
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
                                    <th style={tableHeaderStyle}>Name</th>
                                    <th style={tableHeaderStyle}>Specialization</th>
                                    <th style={tableHeaderStyle}>Timezone</th>
                                    <th style={tableHeaderStyle}>Slot Duration</th>
                                    <th style={tableHeaderStyle}>Working Start</th>
                                    <th style={tableHeaderStyle}>Working End</th>
                                </tr>
                                {/* Filter Row */}
                                <tr style={{ backgroundColor: '#fff' }}>
                                    <th style={filterCellStyle}></th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={nameInput}
                                            onChange={handleInputChange(setNameInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={specializationInput}
                                            onChange={handleInputChange(setSpecializationInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={timezoneInput}
                                            onChange={handleInputChange(setTimezoneInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={slotDurationInput}
                                            onChange={handleInputChange(setSlotDurationInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={workingStartInput}
                                            onChange={handleInputChange(setWorkingStartInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                    <th style={filterCellStyle}>
                                        <input
                                            type="text"
                                            value={workingEndInput}
                                            onChange={handleInputChange(setWorkingEndInput)}
                                            placeholder="Filter..."
                                            style={filterInputStyle}
                                        />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                            Loading doctors...
                                        </td>
                                    </tr>
                                ) : doctors.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{
                                            textAlign: 'center',
                                            padding: '3rem',
                                            color: '#666',
                                            backgroundColor: '#f9f9f9'
                                        }}>
                                            No doctors found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    doctors.map((doctor, index) => (
                                        <tr key={doctor.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={tableCellStyle}>
                                                {(currentPage - 1) * 10 + index + 1}
                                            </td>
                                            <td style={tableCellStyle}>{doctor.name}</td>
                                            <td style={tableCellStyle}>{doctor.specialization}</td>
                                            <td style={tableCellStyle}>{doctor.timezone}</td>
                                            <td style={tableCellStyle}>{doctor.slotDuration} min</td>
                                            <td style={tableCellStyle}>{doctor.workingStart}</td>
                                            <td style={tableCellStyle}>{doctor.workingEnd}</td>
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

export default DoctorTable;
