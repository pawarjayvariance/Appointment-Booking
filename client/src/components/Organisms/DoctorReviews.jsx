import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, ChevronLeft, ChevronRight, MessageSquare, User } from 'lucide-react';
import Button from '../Atoms/Button';
import Avatar from '../Atoms/Avatar';
import './DoctorReviews.css';

const DoctorReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            try {
                const res = await axios.get(
                    `http://localhost:5000/api/doctor/reviews?page=${currentPage}&limit=10`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setReviews(res.data.data);
                setTotalPages(res.data.totalPages);
                setTotalRecords(res.data.totalRecords);
            } catch (err) {
                setError('Failed to fetch reviews');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [currentPage, token]);

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={16}
                fill={i < rating ? "#FFD700" : "none"}
                color={i < rating ? "#FFD700" : "#cbd5e1"}
            />
        ));
    };

    return (
        <div className="doctor-reviews-container">
            <div className="reviews-header">
                <h2>Patient Feedbacks</h2>
                <div className="stats-badge">
                    <MessageSquare size={16} />
                    <span>{totalRecords} Reviews</span>
                </div>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <div className="reviews-list-wrapper">
                {loading ? (
                    <div className="loading-state">
                        <span className="spinner"></span>
                        <p>Loading feedbacks...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare size={48} color="#cbd5e1" />
                        <p>No reviews yet.</p>
                    </div>
                ) : (
                    <table className="reviews-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Rating</th>
                                <th>Feedback</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map((review) => (
                                <tr key={review.id}>
                                    <td>
                                        <div className="patient-cell">
                                            <Avatar src={review.user?.profilePic} name={review.user?.name} size="small" />
                                            <span>{review.user?.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="stars-cell">
                                            {renderStars(review.rating)}
                                        </div>
                                    </td>
                                    <td className="feedback-cell">
                                        <p>{review.feedback || <span className="no-text">No message provided.</span>}</p>
                                    </td>
                                    <td>
                                        <span className="date-cell">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loading}
                    >
                        <ChevronLeft size={20} />
                    </Button>
                    <span className="page-count">Page {currentPage} of {totalPages}</span>
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || loading}
                    >
                        <ChevronRight size={20} />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default DoctorReviews;
