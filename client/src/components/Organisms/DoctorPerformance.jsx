import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Star, TrendingUp, Users, Calendar, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/DoctorPerformance.css';

const DoctorPerformance = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/admin/doctor-performance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPerformanceData(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching performance data:', err);
            setError('Failed to fetch doctor performance data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedData = useMemo(() => {
        let filtered = performanceData.filter(doctor =>
            doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [performanceData, searchTerm, sortConfig]);

    const totalStats = useMemo(() => {
        return performanceData.reduce((acc, curr) => {
            acc.appointments += curr.totalAppointments;
            acc.reviews += curr.totalReviews;
            acc.avgRating += curr.averageRating;
            return acc;
        }, { appointments: 0, reviews: 0, avgRating: 0 });
    }, [performanceData]);

    const globalAvgRating = performanceData.length > 0
        ? (totalStats.avgRating / performanceData.length).toFixed(1)
        : 0;

    if (loading) return <div className="loading-state">Loading performance metrics...</div>;
    if (error) return <div className="error-state">{error}</div>;

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={14} className="sort-icon" />;
        return <span className="sort-icon">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <div className="performance-container">
            <div className="performance-header">
                <h2>Doctor Performance Dashboard</h2>
                <TrendingUp size={24} color="#007bff" />
            </div>

            <div className="stats-summary">
                <div className="stat-card">
                    <span className="stat-label flex items-center gap-2">
                        <Users size={16} /> Total Doctors
                    </span>
                    <span className="stat-value">{performanceData.length}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">
                        <Calendar size={16} /> Total Appointments
                    </span>
                    <span className="stat-value">{totalStats.appointments}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">
                        <Star size={16} /> Avg Global Rating
                    </span>
                    <span className="stat-value">{globalAvgRating} / 5.0</span>
                </div>
            </div>

            <div className="filters-section">
                <input
                    type="text"
                    placeholder="Filter by name or specialization..."
                    className="filter-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="performance-table-wrapper">
                <table className="performance-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th onClick={() => handleSort('name')}>
                                Doctor Name <SortIcon column="name" />
                            </th>
                            <th onClick={() => handleSort('specialization')}>
                                Specialization <SortIcon column="specialization" />
                            </th>
                            <th onClick={() => handleSort('averageRating')}>
                                Avg Rating <SortIcon column="averageRating" />
                            </th>
                            <th onClick={() => handleSort('totalAppointments')}>
                                Total Appts <SortIcon column="totalAppointments" />
                            </th>
                            <th onClick={() => handleSort('totalReviews')}>
                                Total Reviews <SortIcon column="totalReviews" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedData.length > 0 ? (
                            filteredAndSortedData.map((doctor, index) => (
                                <tr key={doctor.doctorId}>
                                    <td>{index + 1}</td>
                                    <td style={{ fontWeight: '500' }}>
                                        <Link
                                            to={`/admin/doctors/${doctor.doctorId}`}
                                            style={{ textDecoration: 'none', color: '#007bff', cursor: 'pointer' }}
                                        >
                                            {doctor.name}
                                        </Link>
                                    </td>
                                    <td>{doctor.specialization}</td>
                                    <td>
                                        <div className="rating-stars">
                                            <Star size={16} fill={doctor.averageRating > 0 ? "currentColor" : "none"} />
                                            <span className="rating-value">{doctor.averageRating}</span>
                                        </div>
                                    </td>
                                    <td>{doctor.totalAppointments}</td>
                                    <td>{doctor.totalReviews}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="empty-state">No performance data found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DoctorPerformance;
