const prisma = require('../config/prisma');
const { acquireLock, releaseLock } = require('../config/redis');
const Joi = require('joi');


const bookingSchema = Joi.object({
    doctorId: Joi.string().required(),
    timeSlotId: Joi.string().required(),
    name: Joi.string().allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional(),
    note: Joi.string().allow('', null).max(500),
    phone: Joi.string().required(), // Simple validation, can be enhanced
    gender: Joi.string().valid('male', 'female', 'other').required(),
    dob: Joi.date().iso().required(),
    address: Joi.string().required()
});

// ... (existing code, ensure lines match up)

// send doctors info in response 
const getDoctors = async (req, res) => {
    try {
        const where = {};

        // If logged in, filter by tenant unless super_admin
        if (req.user) {
            if (req.user.role !== 'super_admin') {
                where.tenantId = req.tenantId;
            }
        } else if (req.query.tenantId) {
            // For public access, require/allow tenantId from query
            where.tenantId = req.query.tenantId;
        }

        const doctors = await prisma.doctor.findMany({
            where,
            include: {
                user: {
                    select: {
                        profilePic: true
                    }
                }
            }
        });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
};

// send response of selected doctors slots
const getSlotsByDoctor = async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query; // Expecting YYYY-MM-DD

    try {
        const slots = await prisma.timeSlot.findMany({
            where: {
                doctorId,
                date: new Date(date),
                // Data isolation: filter by tenantId if provided in query or user session
                ...(req.user ? (req.user.role !== 'super_admin' && { tenantId: req.tenantId }) : (req.query.tenantId && { tenantId: req.query.tenantId }))
            },
            include: {
                appointment: true,
                doctor: {
                    include: { user: { select: { profilePic: true } } }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch slots' });
    }
};

// send all doctors slots in combination 
const getAllSlots = async (req, res) => {
    const { date } = req.query; // Expecting YYYY-MM-DD
    try {
        const slots = await prisma.timeSlot.findMany({
            where: {
                date: new Date(date),
                // Data isolation: filter by tenantId if provided in query or user session
                ...(req.user ? (req.user.role !== 'super_admin' && { tenantId: req.tenantId }) : (req.query.tenantId && { tenantId: req.query.tenantId }))
            },
            include: {
                doctor: {
                    include: { user: { select: { profilePic: true } } }
                },
                appointment: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch all slots' });
    }
};


// sending data to server 
const createBooking = async (req, res) => {
    const { error, value } = bookingSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { doctorId, timeSlotId, name: bodyName, email: bodyEmail, note, phone, gender, dob, address } = value;

    // Get user info from authenticated request, but allow override if provided
    const userId = req.user.id;
    const name = bodyName || req.user.name;
    const email = bodyEmail || req.user.email;

    try {
        // 1. Acquire Redis Lock to prevent race conditions
        const locked = await acquireLock(timeSlotId);
        if (!locked) {
            return res.status(409).json({ error: 'This slot is currently being processed. Please try again.' });
        }

        // 2. Wrap in Prisma Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Check if slot is already booked
            const slot = await tx.timeSlot.findUnique({
                where: { id: timeSlotId },
                select: { isBooked: true }
            });

            if (!slot || slot.isBooked) {
                throw new Error('Slot already booked or doesn\'t exist');
            }

            // Create Appointment with authenticated user's data
            const appointment = await tx.appointment.create({
                data: {
                    doctorId,
                    timeSlotId,
                    name,
                    email,
                    note,
                    userId,
                    tenantId: req.tenantId, // Assign tenantId from user
                    additionalInfo: {
                        phone,
                        gender,
                        dob,
                        address
                    }
                }
            });

            // Update TimeSlot status
            await tx.timeSlot.update({
                where: { id: timeSlotId },
                data: { isBooked: true }
            });

            return appointment;
        });

        // 3. Emit real-time update via Socket.io
        if (req.io) {
            req.io.emit('slotUpdated', { timeSlotId, isBooked: true });
        }

        res.status(201).json({ message: 'Booking successful', appointment: result });

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    } finally {
        // 4. Release Redis Lock
        await releaseLock(timeSlotId);
    }
};


// send selected time slots all data to client side 
const getAppointmentBySlot = async (req, res) => {
    const { timeSlotId } = req.params;
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { timeSlotId },
            include: { timeSlot: true }
        });
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch appointment' });
    }
};


// get logged-in user's appointments
const getMyAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: { userId: req.user.id },
            include: { timeSlot: true, doctor: true }
        });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

// Cancel (Delete) Appointment
const cancelAppointment = async (req, res) => {
    const { appointmentId } = req.params;

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { timeSlot: true }
        });

        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        // Authorization: User can ONLY cancel their own
        if (appointment.userId !== req.user.id) {
            return res.status(403).json({ error: 'You do not have permission to cancel this appointment' });
        }

        const timeSlotId = appointment.timeSlotId;

        await prisma.$transaction(async (tx) => {
            // Delete appointment
            await tx.appointment.delete({ where: { id: appointmentId } });

            // Free the slot
            await tx.timeSlot.update({
                where: { id: timeSlotId },
                data: { isBooked: false }
            });
        });

        // Notify clients
        if (req.io) {
            req.io.emit('slotUpdated', { timeSlotId, isBooked: false });
            req.io.emit('appointmentCanceled', { appointmentId, timeSlotId });
        }

        res.json({ message: 'Appointment canceled successfully' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to cancel appointment' });
    }
};

// Reschedule Appointment
const rescheduleAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    const { newTimeSlotId } = req.body;

    if (!newTimeSlotId) return res.status(400).json({ error: 'New Time Slot ID is required' });

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        });

        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        // Authorization: User can ONLY reschedule their own
        if (appointment.userId !== req.user.id) {
            return res.status(403).json({ error: 'You do not have permission to reschedule this appointment' });
        }

        const oldTimeSlotId = appointment.timeSlotId;
        if (oldTimeSlotId === newTimeSlotId) {
            return res.status(400).json({ error: 'New slot must be different from current slot' });
        }

        // 1. Acquire Redis Lock for NEW slot
        const locked = await acquireLock(newTimeSlotId);
        if (!locked) return res.status(409).json({ error: 'The selected slot is currently being processed. Please try again.' });

        try {
            const updatedAppt = await prisma.$transaction(async (tx) => {
                // Check if new slot is available
                const newSlot = await tx.timeSlot.findUnique({
                    where: { id: newTimeSlotId },
                    select: { isBooked: true }
                });

                if (!newSlot) throw new Error('New slot does not exist');
                if (newSlot.isBooked) throw new Error('New slot is already booked');

                // 2. Free old slot
                await tx.timeSlot.update({
                    where: { id: oldTimeSlotId },
                    data: { isBooked: false }
                });

                // 3. Book new slot
                await tx.timeSlot.update({
                    where: { id: newTimeSlotId },
                    data: { isBooked: true }
                });

                // 4. Update Appointment
                return await tx.appointment.update({
                    where: { id: appointmentId },
                    data: { timeSlotId: newTimeSlotId },
                    include: { timeSlot: true, doctor: true }
                });
            });

            // Notify clients - per requirement 4
            if (req.io) {
                req.io.emit('slot:updated', { timeSlotId: oldTimeSlotId, isBooked: false });
                req.io.emit('slot:updated', { timeSlotId: newTimeSlotId, isBooked: true });
                req.io.emit('appointment:rescheduled', { appointmentId, appointment: updatedAppt });
            }

            res.json({ message: 'Appointment rescheduled successfully', appointment: updatedAppt });

        } finally {
            // Release lock
            await releaseLock(newTimeSlotId);
        }

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};

// to update booked time slot information
const updateAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    const { note, phone, gender, dob, address } = req.body;

    try {
        const currentAppt = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: { userId: true, additionalInfo: true }
        });

        if (!currentAppt) return res.status(404).json({ error: 'Appointment not found' });

        // Authorization: User can only update their own appointments
        if (currentAppt.userId !== req.user.id) {
            return res.status(403).json({ error: 'You do not have permission to update this appointment' });
        }

        // Prepare additional info update
        const updatedAdditionalInfo = {
            ...(currentAppt.additionalInfo || {}), // Keep existing if any (though we are likely overwriting all)
            ...(phone && { phone }),
            ...(gender && { gender }),
            ...(dob && { dob }),
            ...(address && { address })
        };

        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                note,
                additionalInfo: updatedAdditionalInfo
            }
        });

        if (req.io) {
            req.io.emit('appointmentUpdated', { appointmentId });
        }

        res.json({ message: 'Appointment updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// get patient's appointment history with pagination
const getUserAppointmentHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.id;

        const where = { userId };

        const totalRecords = await prisma.appointment.count({ where });

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                doctor: {
                    select: {
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
                timeSlot: {
                    date: 'desc'
                }
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
        console.error('Error fetching appointment history:', error);
        res.status(500).json({ error: 'Failed to fetch appointment history' });
    }
};

// get detailed doctor info for patients
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
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Calculate average rating
        const avgRatingAggregation = await prisma.review.aggregate({
            where: {
                doctorId: doctor.id,
                tenantId: req.tenantId
            },
            _avg: { rating: true }
        });

        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=random`;
        const profilePhoto = doctor.user?.profilePic || defaultAvatar;

        res.json({
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.specialization,
            profilePic: doctor.user?.profilePic,
            profilePhoto: profilePhoto,
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
        console.error('Error in getDoctorDetails (patient):', error);
        res.status(500).json({ error: 'Failed to fetch doctor details' });
    }
};

module.exports = {
    getDoctors,
    getSlotsByDoctor,
    getAllSlots,
    createBooking,
    getAppointmentBySlot,
    updateAppointment,
    getMyAppointments,
    getUserAppointmentHistory,
    cancelAppointment,
    rescheduleAppointment,
    getDoctorDetails
};
