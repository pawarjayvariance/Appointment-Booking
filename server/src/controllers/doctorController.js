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
                    select: { id: true, name: true, email: true }
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

module.exports = {
    getAppointments,
    getSchedule,
    updateWorkingHours,
    disableSlots,
    enableSlots
};
