const prisma = require('../config/prisma');
const { generateSlots } = require('../config/scheduler');
const { startOfToday, addDays } = require('date-fns');

/**
 * Get appointments for the logged-in doctor with pagination and filtering
 */
const getAppointments = async (req, res) => {
    // ... (existing implementation)
    try {
        const { userName, userEmail, date, page = 1, limit = 10 } = req.query;

        // 1. Find the doctor associated with the logged-in user
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id }
        });

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor profile not found for this user.' });
        }

        const doctorId = doctor.id;

        // 2. Build where clause
        const where = {
            doctorId: doctorId,
            tenantId: req.tenantId // Data isolation
        };

        // Filter by user (patient) name
        if (userName) {
            where.user = {
                ...where.user,
                name: {
                    contains: userName,
                    mode: 'insensitive'
                }
            };
        }

        // Filter by user (patient) email
        if (userEmail) {
            where.user = {
                ...where.user,
                email: {
                    contains: userEmail,
                    mode: 'insensitive'
                }
            };
        }

        // Filter by date
        if (date) {
            where.timeSlot = {
                date: new Date(date)
            };
        }

        // 3. Get total count for pagination
        const totalRecords = await prisma.appointment.count({ where });

        // 4. Fetch appointments
        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true, profilePic: true }
                },
                timeSlot: {
                    select: { startTime: true, endTime: true, date: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        res.json({
            data: appointments,
            page: parseInt(page),
            totalPages: Math.ceil(totalRecords / parseInt(limit)),
            totalRecords
        });
    } catch (error) {
        console.error('Error fetching doctor appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

/**
 * Get all slots for a specific date for the logged-in doctor
 */
const getSchedule = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'Date is required' });

        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id }
        });

        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        const slots = await prisma.timeSlot.findMany({
            where: {
                doctorId: doctor.id,
                date: new Date(date),
                tenantId: req.tenantId // Data isolation
            },
            include: {
                appointment: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        res.json({ slots, doctor });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Update working hours and slot duration
 */
const updateWorkingHours = async (req, res) => {
    try {
        const { workingStart, workingEnd, slotDuration } = req.body;

        // Validation
        if (!workingStart || !workingEnd || !slotDuration) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (slotDuration <= 0) {
            return res.status(400).json({ error: 'Slot duration must be positive' });
        }

        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id }
        });

        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        // Update doctor profile
        await prisma.doctor.update({
            where: { id: doctor.id },
            data: {
                workingStart,
                workingEnd,
                slotDuration: parseInt(slotDuration)
            }
        });

        // Delete future unbooked slots
        await prisma.timeSlot.deleteMany({
            where: {
                doctorId: doctor.id,
                isBooked: false,
                startTime: {
                    gte: startOfToday()
                }
            }
        });

        // Regenerate slots
        await generateSlots(doctor.id);

        // Notify clients about availability changes
        if (req.io) {
            req.io.emit('availability_updated', { doctorId: doctor.id });
        }

        res.json({ message: 'Working hours updated and slots regenerated successfully' });
    } catch (error) {
        console.error('Error updating working hours:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Mark slots as unavailable (Disable Slots)
 */
const disableSlots = async (req, res) => {
    try {
        const { slotIds } = req.body;
        if (!Array.isArray(slotIds) || slotIds.length === 0) {
            return res.status(400).json({ error: 'slotIds array is required' });
        }

        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id }
        });

        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        // Ensure slots belong to doctor and are not already booked with an appointment
        const slotsToUpdate = await prisma.timeSlot.findMany({
            where: {
                id: { in: slotIds },
                doctorId: doctor.id,
                appointment: null // Cannot disable a slot that already has a patient
            }
        });

        const validIds = slotsToUpdate.map(s => s.id);

        if (validIds.length === 0) {
            return res.status(400).json({ error: 'No valid unbooked slots found to disable' });
        }

        await prisma.timeSlot.updateMany({
            where: {
                id: { in: validIds }
            },
            data: {
                isBooked: true
            }
        });

        // Notify clients about availability changes
        if (req.io) {
            req.io.emit('availability_updated', { doctorId: doctor.id });
        }

        res.json({ message: `${validIds.length} slots disabled successfully` });
    } catch (error) {
        console.error('Error disabling slots:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Mark slots as available (Enable Slots)
 */
const enableSlots = async (req, res) => {
    try {
        const { slotIds } = req.body;
        if (!Array.isArray(slotIds) || slotIds.length === 0) {
            return res.status(400).json({ error: 'slotIds array is required' });
        }

        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id }
        });

        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        // Ensure slots belong to doctor and are NOT already booked with an appointment
        const slotsToUpdate = await prisma.timeSlot.findMany({
            where: {
                id: { in: slotIds },
                doctorId: doctor.id,
                appointment: null
            }
        });

        const validIds = slotsToUpdate.map(s => s.id);

        if (validIds.length === 0) {
            return res.status(400).json({ error: 'No valid disabled slots found to enable' });
        }

        await prisma.timeSlot.updateMany({
            where: {
                id: { in: validIds }
            },
            data: {
                isBooked: false
            }
        });

        // Notify clients about availability changes
        if (req.io) {
            req.io.emit('availability_updated', { doctorId: doctor.id });
        }

        res.json({ message: `${validIds.length} slots enabled successfully` });
    } catch (error) {
        console.error('Error enabling slots:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get the logged-in doctor's professional profile
 */
const getDoctorProfile = async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
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
            return res.status(404).json({ error: 'Doctor profile not found' });
        }

        // Calculate average rating
        const avgRatingAggregation = await prisma.review.aggregate({
            where: {
                doctorId: doctor.id,
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
        console.error('Error in getDoctorProfile:', error);
        res.status(500).json({ error: 'Failed to fetch doctor profile' });
    }
};

/**
 * Get user specific details for doctor
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
        console.error('Error in doctor getUserDetails:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

/**
 * Get doctor specific details for doctor (colleague view)
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
                    select: { profilePic: true }
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
                            select: { name: true, profilePic: true }
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
                doctorId: doctor.id,
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
        console.error('Error in doctor getDoctorDetails:', error);
        res.status(500).json({ error: 'Failed to fetch doctor details' });
    }
};

module.exports = {
    getAppointments,
    getSchedule,
    updateWorkingHours,
    disableSlots,
    enableSlots,
    getDoctorProfile,
    getUserDetails,
    getDoctorDetails
};
