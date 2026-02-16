import React, { useState } from 'react';
import { Star } from 'lucide-react';

const ReviewStars = ({ rating = 0, maxRating = 5, onRatingChange, interactive = false, size = 16 }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="review-stars" style={{ display: 'flex', gap: '2px' }}>
            {[...Array(maxRating)].map((_, index) => {
                const starIndex = index + 1;
                const isFull = (hover || rating) >= starIndex;

                return (
                    <button
                        key={index}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onRatingChange(starIndex)}
                        onMouseEnter={() => interactive && setHover(starIndex)}
                        onMouseLeave={() => interactive && setHover(0)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: interactive ? 'pointer' : 'default',
                            color: isFull ? '#fbbf24' : '#e2e8f0', // amber-400 : gray-200
                            display: 'flex',
                            transition: 'transform 0.1s ease',
                            transform: interactive && hover === starIndex ? 'scale(1.2)' : 'none'
                        }}
                    >
                        <Star
                            size={size}
                            fill={isFull ? 'currentColor' : 'none'}
                            strokeWidth={isFull ? 1 : 2}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default ReviewStars;
