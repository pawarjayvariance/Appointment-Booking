const prisma = require('../config/prisma');

/**
 * Submit a review for a doctor
 */
const submitReview = async (req, res) => {
    try {
        const { doctorId, rating, feedback } = req.body;
        const userId = req.user.id;

        // 1. Validation
        if (!doctorId || !rating) {
            return res.status(400).json({ error: 'Doctor ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // 2. Check if user has had an appointment with this doctor
        const appointment = await prisma.appointment.findFirst({
            where: {
                userId,
                doctorId
            }
        });

        if (!appointment) {
            return res.status(403).json({ error: 'You can only review doctors you have had an appointment with' });
        }

        // 3. Create review
        const review = await prisma.review.create({
            data: {
                userId,
                doctorId,
                rating: parseInt(rating),
                feedback,
                tenantId: req.tenantId // Ensure review is associated with the tenant
            }
        });

        res.status(201).json({ message: 'Review submitted successfully', review });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
};

/**
 * Get reviews for a specific doctor (Public/Patient view) or for the logged-in doctor
 */
const getDoctorReviews = async (req, res) => {
    try {
        const { doctorId, page = 1, limit = 10 } = req.query;
        let targetDoctorId = doctorId;

        // If no doctorId provided and user is a doctor, show their own reviews
        if (!targetDoctorId && req.user && req.user.role === 'doctor') {
            const doctor = await prisma.doctor.findUnique({
                where: { userId: req.user.id }
            });
            if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });
            targetDoctorId = doctor.id;
        }

        if (!targetDoctorId) {
            return res.status(400).json({ error: 'Doctor ID is required' });
        }

        const totalRecords = await prisma.review.count({
            where: { doctorId: targetDoctorId }
        });

        const reviews = await prisma.review.findMany({
            where: { doctorId: targetDoctorId },
            include: {
                user: {
                    select: { name: true, profilePic: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        res.json({
            data: reviews,
            page: parseInt(page),
            totalPages: Math.ceil(totalRecords / parseInt(limit)),
            totalRecords
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

/**
 * Get average rating for a doctor
 */
const getAverageRating = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const result = await prisma.review.aggregate({
            where: { doctorId },
            _avg: { rating: true },
            _count: { id: true }
        });

        res.json({
            averageRating: result._avg.rating || 0,
            reviewCount: result._count.id || 0
        });
    } catch (error) {
        console.error('Error calculating average rating:', error);
        res.status(500).json({ error: 'Failed to fetch rating statistics' });
    }
};

/**
 * Get a summary of reviews for a specific doctor
 */
const getReviewsSummary = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { excludeUser } = req.query;

        // 1. Get statistics (avg rating, total count)
        const stats = await prisma.review.aggregate({
            where: {
                doctorId,
                NOT: excludeUser ? { userId: excludeUser } : undefined
            },
            _avg: { rating: true },
            _count: { id: true }
        });

        // 2. Get all reviews with user details
        const latestReviews = await prisma.review.findMany({
            where: {
                doctorId,
                NOT: excludeUser ? { userId: excludeUser } : undefined
            },
            include: {
                user: {
                    select: { name: true, profilePic: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            averageRating: stats._avg.rating || 0,
            reviewCount: stats._count.id || 0,
            latestReviews
        });
    } catch (error) {
        console.error('Error fetching reviews summary:', error);
        res.status(500).json({ error: 'Failed to fetch reviews summary' });
    }
};

module.exports = {
    submitReview,
    getDoctorReviews,
    getAverageRating,
    getReviewsSummary
};
