const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const doctorController = require('../controllers/doctorController');
const profileController = require('../controllers/profileController');
const reviewController = require('../controllers/reviewController');
const tenantController = require('../controllers/tenantController');
const upload = require('../config/uploadConfig');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const prisma = require('../config/prisma');

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Profile Routes
router.get('/profile', authMiddleware, profileController.getProfile);
router.patch('/profile', authMiddleware, upload.single('profilePicFile'), profileController.updateProfile);

// Public Routes (Optional tenant filtering should be handled in controllers via query params if needed)
router.get('/doctors', bookingController.getDoctors);
router.get('/slots', bookingController.getAllSlots);
router.get('/doctors/:doctorId/slots', bookingController.getSlotsByDoctor);
router.get('/appointments/by-slot/:timeSlotId', bookingController.getAppointmentBySlot);

// User Routes
router.get('/user/appointments/history', authMiddleware, authorize('user'), bookingController.getUserAppointmentHistory);
router.get('/my-appointments', authMiddleware, authorize('user', 'admin'), bookingController.getMyAppointments);
router.post('/bookings', authMiddleware, authorize('user', 'admin'), bookingController.createBooking);
router.put('/appointments/:appointmentId', authMiddleware, authorize('user', 'admin'), bookingController.updateAppointment);
router.delete('/appointments/:appointmentId', authMiddleware, authorize('user', 'admin'), bookingController.cancelAppointment);
router.patch('/appointments/:appointmentId/reschedule', authMiddleware, authorize('user', 'admin'), bookingController.rescheduleAppointment);

// Doctor Routes
router.get('/doctor/appointments', authMiddleware, authorize('doctor'), doctorController.getAppointments);
router.get('/doctor/schedule', authMiddleware, authorize('doctor'), doctorController.getSchedule);
router.patch('/doctor/schedule/update-hours', authMiddleware, authorize('doctor'), doctorController.updateWorkingHours);
router.post('/doctor/schedule/disable-slots', authMiddleware, authorize('doctor'), doctorController.disableSlots);
router.post('/doctor/schedule/enable-slots', authMiddleware, authorize('doctor'), doctorController.enableSlots);

// testing api 
router.get('/user', async (req, res) => {

    try {
        const user = await prisma.user.findMany();
        if (!user) {
            res.json({ msg: "user not exist" });
        }
        res.json(user);

    } catch (error) {
        res.status(500).json({ msg: "internal server error!" })
    }
});

const superAdminController = require('../controllers/superAdminController');

// Admin Routes
router.get('/admin/appointments', authMiddleware, authorize('admin', 'super_admin'), adminController.getAppointments);
router.get('/admin/doctors', authMiddleware, authorize('admin', 'super_admin'), adminController.getDoctors);
router.get('/admin/users', authMiddleware, authorize('admin', 'super_admin'), adminController.getUsers);
router.get('/admin/doctor-performance', authMiddleware, authorize('admin', 'super_admin'), adminController.getDoctorPerformance);

// Super Admin Routes
router.get('/super-admin/dashboard', authMiddleware, authorize('super_admin'), superAdminController.getDashboardStats);
router.get('/super-admin/tenants', authMiddleware, authorize('super_admin'), superAdminController.getTenants);
router.post('/super-admin/tenants', authMiddleware, authorize('super_admin'), superAdminController.createTenant);
router.patch('/super-admin/tenants/:id', authMiddleware, authorize('super_admin'), superAdminController.updateTenant);
router.patch('/super-admin/tenants/:id/status', authMiddleware, authorize('super_admin'), superAdminController.updateTenantStatus);
router.get('/super-admin/users', authMiddleware, authorize('super_admin'), superAdminController.getGlobalUsers);
router.get('/super-admin/appointments', authMiddleware, authorize('super_admin'), superAdminController.getGlobalAppointments);
router.get('/super-admin/analytics', authMiddleware, authorize('super_admin'), superAdminController.getPlatformAnalytics);
router.get('/super-admin/stats', authMiddleware, authorize('super_admin'), superAdminController.getDashboardStats); // Keep for compatibility

// Review Routes
router.post('/reviews', authMiddleware, authorize('user'), reviewController.submitReview);
router.get('/doctor/reviews', authMiddleware, authorize('doctor'), reviewController.getDoctorReviews);
router.get('/doctors/:doctorId/ratings', reviewController.getAverageRating);
router.get('/doctors/:doctorId/reviews-summary', reviewController.getReviewsSummary);

module.exports = router;