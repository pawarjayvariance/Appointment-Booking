const prisma = require('../config/prisma');

/**
 * Get appointments with nested filtering and pagination (Admin only)
 */
const getAppointments = async (req, res) => {
    try {
        const { doctorId, userName, userEmail, doctorName, page = 1, limit = 10 } = req.query;

        // Build where clause for nested filtering
        const where = {};

        // Data Isolation: Filter by tenantId if not super_admin
        if (req.user.role !== 'super_admin') {
            where.tenantId = req.tenantId;
        }

        // Filter by doctor ID (if provided)
        if (doctorId) {
            where.doctorId = doctorId;
        }

        // Filter by user name
        if (userName) {
            where.user = {
                ...where.user,
                name: {
                    contains: userName,
                    mode: 'insensitive'
                }
            };
        }

        // Filter by user email
        if (userEmail) {
            where.user = {
                ...where.user,
                email: {
                    contains: userEmail,
                    mode: 'insensitive'
                }
            };
        }

        // Filter by doctor name
        if (doctorName) {
            where.doctor = {
                name: {
                    contains: doctorName,
                    mode: 'insensitive'
                }
            };
        }

        // Filter by date
        if (req.query.date) {
            where.timeSlot = {
                date: new Date(req.query.date)
            };
        }

        // Get total count for pagination
        const totalCount = await prisma.appointment.count({ where });

        // Fetch appointments with pagination
        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true, profilePic: true }
                },
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        specialization: true,
                        user: { select: { profilePic: true } }
                    }
                },
                timeSlot: {
                    select: { startTime: true, endTime: true, date: true }
                }
            },
            orderBy: {
                createdAt: 'desc' // Latest first
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        res.json({
            appointments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

/**
 * Get doctors with column-wise filtering and pagination (Admin only)
 */
const getDoctors = async (req, res) => {
    try {
        const {
            name,
            specialization,
            timezone,
            slotDuration,
            workingStart,
            workingEnd,
            page = 1,
            limit = 10
        } = req.query;

        // Build where clause for nested filtering 
        const where = {};

        // Data Isolation: Filter by tenantId if not super_admin
        if (req.user.role !== 'super_admin') {
            where.tenantId = req.tenantId;
        }

        // Column-wise filters (all case-insensitive partial matches)
        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive'
            };
        }

        if (specialization) {
            where.specialization = {
                contains: specialization,
                mode: 'insensitive'
            };
        }

        if (timezone) {
            where.timezone = {
                contains: timezone,
                mode: 'insensitive'
            };
        }

        if (slotDuration) {
            where.slotDuration = parseInt(slotDuration);
        }

        if (workingStart) {
            where.workingStart = {
                contains: workingStart,
                mode: 'insensitive'
            };
        }

        if (workingEnd) {
            where.workingEnd = {
                contains: workingEnd,
                mode: 'insensitive'
            };
        }

        // Get total count for pagination
        const totalCount = await prisma.doctor.count({ where });

        // Fetch doctors with pagination
        const doctors = await prisma.doctor.findMany({
            where,
            select: {
                id: true,
                name: true,
                specialization: true,
                timezone: true,
                slotDuration: true,
                workingStart: true,
                workingEnd: true,
                user: { select: { profilePic: true } }
            },
            orderBy: {
                name: 'asc'
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        res.json({
            doctors,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
};



/**
 * Get users with column-wise filtering and pagination (Admin only)
 */
const getUsers = async (req, res) => {
    try {
        const {
            name,
            email,
            role,
            page = 1,
            limit = 10
        } = req.query;

        // Build where clause for nested filtering
        const where = {};

        // Data Isolation: Filter by tenantId if not super_admin
        if (req.user.role !== 'super_admin') {
            where.tenantId = req.tenantId;
        }

        // Column-wise filters
        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive'
            };
        }

        if (email) {
            where.email = {
                contains: email,
                mode: 'insensitive'
            };
        }

        if (role) {
            where.role = role; // Exact match for enum
        }

        // Get total count for pagination
        const totalCount = await prisma.user.count({ where });

        // Fetch users with pagination 
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profilePic: true,
                createdAt: true,
                doctor: {
                    select: { id: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        res.json({
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Get doctor performance metrics (Admin only) 
 */
const getDoctorPerformance = async (req, res) => {
    try {
        const { sortBy = 'name', order = 'asc' } = req.query;

        // Fetch all doctors
        const doctors = await prisma.doctor.findMany({
            select: {
                id: true,
                name: true,
                specialization: true,
            }
        });

        // Get appointment counts grouped by doctor
        const appointmentCounts = await prisma.appointment.groupBy({
            by: ['doctorId'],
            _count: {
                id: true
            }
        });

        // Get review stats grouped by doctor
        const reviewStats = await prisma.review.groupBy({
            by: ['doctorId'],
            _count: {
                id: true
            },
            _avg: {
                rating: true
            }
        });

        // Map data together
        let performanceData = doctors.map(doctor => {
            const appt = appointmentCounts.find(a => a.doctorId === doctor.id);
            const review = reviewStats.find(r => r.doctorId === doctor.id);

            return {
                doctorId: doctor.id,
                name: doctor.name,
                specialization: doctor.specialization,
                averageRating: review && review._avg.rating ? parseFloat(review._avg.rating.toFixed(1)) : 0,
                totalAppointments: appt ? appt._count.id : 0,
                totalReviews: review ? review._count.id : 0
            };
        });

        // Sorting logic
        performanceData.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });

        res.json(performanceData);
    } catch (error) {
        console.error('Error fetching doctor performance:', error);
        res.status(500).json({ error: 'Failed to fetch doctor performance metrics' });
    }
};

/**
 * Get user specific details for admin
 */
const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [user, reviewsCount, appointments, totalCount] = await Promise.all([
            prisma.user.findFirst({
                where: {
                    id: userId,
                    tenantId: req.tenantId
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    profilePic: true,
                    createdAt: true,
                    tenant: {
                        select: { name: true, id: true }
                    },
                    doctor: {
                        select: { id: true }
                    }
                }
            }),
            prisma.review.count({
                where: {
                    userId,
                    tenantId: req.tenantId
                }
            }),
            prisma.appointment.findMany({
                where: {
                    userId,
                    tenantId: req.tenantId
                },
                include: {
                    doctor: {
                        select: { id: true, name: true }
                    },
                    timeSlot: {
                        select: { startTime: true, date: true }
                    },
                    tenant: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.appointment.count({
                where: {
                    userId,
                    tenantId: req.tenantId
                }
            })
        ]);

        if (!user) {
            return res.status(404).json({ error: 'User not found in your tenant' });
        }

        // Format stats
        const stats = {
            total: totalCount,
            reviews: reviewsCount,
            joinedDate: user.createdAt
        };

        res.json({
            ...user,
            stats,
            appointments,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in admin getUserDetails:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

/**
 * Get doctor details for admin
 */
const getDoctorDetails = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const doctor = await prisma.doctor.findFirst({
            where: {
                id: doctorId,
                tenantId: req.tenantId
            },
            include: {
                user: {
                    select: {
                        profilePic: true
                    }
                },
                _count: {
                    select: {
                        appointments: true,
                        reviews: true
                    }
                },
                reviews: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                name: true,
                                profilePic: true
                            }
                        }
                    }
                }
            }
        });

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found in your tenant' });
        }

        // Calculate average rating
        const avgRatingAggregation = await prisma.review.aggregate({
            where: {
                doctorId,
                tenantId: req.tenantId
            },
            _avg: { rating: true }
        });

        res.json({
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.specialization,
            profilePic: doctor.user?.profilePic,
            timezone: doctor.timezone,
            slotDuration: doctor.slotDuration,
            workingStartTime: doctor.workingStart,
            workingEndTime: doctor.workingEnd,
            totalAppointments: doctor._count.appointments,
            totalReviews: doctor._count.reviews,
            averageRating: avgRatingAggregation._avg.rating ? parseFloat(avgRatingAggregation._avg.rating.toFixed(1)) : 0,
            recentReviews: doctor.reviews.map(review => ({
                id: review.id,
                patientName: review.user.name,
                patientProfilePhoto: review.user.profilePic,
                rating: review.rating,
                feedback: review.feedback,
                createdAt: review.createdAt
            }))
        });
    } catch (error) {
        console.error('Error in admin getDoctorDetails:', error);
        res.status(500).json({ error: 'Failed to fetch doctor details' });
    }
};

module.exports = {
    getAppointments,
    getDoctors,
    getUsers,
    getDoctorPerformance,
    getUserDetails,
    getDoctorDetails
};
