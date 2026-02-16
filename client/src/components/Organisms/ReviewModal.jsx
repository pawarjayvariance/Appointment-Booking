import React, { useState } from 'react';
import axios from 'axios';
import { Star, X, AlertCircle } from 'lucide-react';
import Button from '../Atoms/Button';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, doctor, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [feedback, setFeedback] = useState('');
    const [hover, setHover] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/reviews',
                { doctorId: doctor.id, rating, feedback },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onReviewSubmitted();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="review-modal">
                <div className="modal-header">
                    <h3>Rate & Review</h3>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <div className="doctor-info-compact">
                    <p className="subtitle">How was your experience with</p>
                    <h4>{doctor.name}</h4>
                </div>

                {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="rating-input">
                        <p>Your Rating</p>
                        <div className="stars-row">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`star-btn ${star <= (hover || rating) ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <Star size={32} fill={star <= (hover || rating) ? "#FFD700" : "none"} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="feedback-input">
                        <label htmlFor="feedback">Your Feedback (Optional)</label>
                        <textarea
                            id="feedback"
                            placeholder="Tell others about your consultation..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            maxLength={500}
                        />
                        <div className="char-count">{feedback.length}/500</div>
                    </div>

                    <div className="modal-actions">
                        <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
