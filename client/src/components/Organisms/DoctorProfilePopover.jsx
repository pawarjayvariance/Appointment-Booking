import React, { useState, useEffect, useRef } from 'react';
import { X, User, Send, Star, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ReviewStars from '../Atoms/ReviewStars';
import Button from '../Atoms/Button';
import Avatar from '../Atoms/Avatar';
import './DoctorProfilePopover.css';

const DoctorProfilePopover = ({ doctor, isOpen, onClose, token }) => {
    const { user: currentUser } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const popoverRef = useRef(null);

    useEffect(() => {
        if (isOpen && doctor) {
            fetchSummary();
        }
    }, [isOpen, doctor]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const userId = doctor.user?.id; // This is the doctor's userId, not current user
            // We need current user ID. I'll get it from useAuth inside the component.
            const url = `http://localhost:5000/api/doctors/${doctor.id}/reviews-summary${currentUser?.id ? `?excludeUser=${currentUser.id}` : ''}`;
            const res = await axios.get(url);
            setSummary(res.data);
        } catch (err) {
            console.error('Failed to fetch reviews summary');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !doctor) return null;

    return (
        <div className="popover-overlay">
            <div className="popover-card" ref={popoverRef}>
                <button className="popover-close" onClick={onClose} title="Close">
                    <X size={20} />
                </button>

                <div className="popover-header">
                    <div className="popover-avatar">
                        <Avatar src={doctor.user?.profilePic} name={doctor.name} size="large" type="doctor" />
                    </div>
                    <h3 className="popover-title">{doctor.name}</h3>
                    <span className="popover-subtitle">{doctor.specialization}</span>

                    {summary && !loading && (
                        <div className="popover-stats">
                            <ReviewStars rating={summary.averageRating} size={20} />
                            <span className="popover-rating-num">{summary.averageRating.toFixed(1)}</span>
                            <span className="popover-count">({summary.reviewCount} reviews)</span>
                        </div>
                    )}
                </div>

                <div className="popover-content">
                    <h4 className="reviews-section-title">All Feedback</h4>
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>Loading reviews...</p>
                    ) : summary?.latestReviews.length > 0 ? (
                        <div className="reviews-list">
                            {summary.latestReviews.map((rev) => (
                                <div key={rev.id} className="popover-review-item">
                                    <div className="review-header">
                                        <div className="reviewer-avatar">
                                            <Avatar src={rev.user.profilePic} name={rev.user.name} size="small" />
                                        </div>
                                        <span className="reviewer-name">{rev.user.name}</span>
                                        <span className="review-date">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <ReviewStars rating={rev.rating} size={14} />
                                    <p className="review-comment">{rev.feedback}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-reviews">
                            <Star size={32} strokeWidth={1} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                            <p>No recent reviews found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorProfilePopover;
