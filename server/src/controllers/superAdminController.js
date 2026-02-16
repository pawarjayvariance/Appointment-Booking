const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

/**
 * Platform overview metrics
 */
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalTenants,
            activeTenants,
            suspendedTenants,
            totalDoctors,
            totalUsers,
            totalAppointments,
            totalReviews,
            avgRating
        ] = await Promise.all([
            prisma.tenant.count(),
            prisma.tenant.count({ where: { status: 'active' } }),
            prisma.tenant.count({ where: { status: 'suspended' } }),
            prisma.doctor.count(),
            prisma.user.count(),
            prisma.appointment.count(),
            prisma.review.count(),
            prisma.review.aggregate({ _avg: { rating: true } })
        ]);

        res.json({
            totalTenants,
            activeTenants,
            suspendedTenants,
            totalDoctors,
            totalUsers,
            totalAppointments,
            totalReviews,
            platformAverageRating: avgRating._avg.rating ? parseFloat(avgRating._avg.rating.toFixed(1)) : 0
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
};

/**
 * List all tenants with stats
 */
const getTenants = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = search ? {
            name: { contains: search, mode: 'insensitive' }
        } : {};

        const [tenants, totalCount] = await Promise.all([
            prisma.tenant.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            doctors: true,
                            users: true,
                            appointments: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.tenant.count({ where })
        ]);

        res.json({
            tenants,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ error: 'Failed to fetch tenants' });
    }
};

/**
 * Create new tenant and auto-create default admin
 */
const createTenant = async (req, res) => {
    const { name, adminName, adminEmail, adminPassword } = req.body;

    if (!name || !adminName || !adminEmail || !adminPassword) {
        return res.status(400).json({ error: 'Tenant name and default admin details are required' });
    }

    try {
        // Use a transaction to ensure both tenant and admin are created
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: { name, status: 'active' }
            });

            const passwordHash = await bcrypt.hash(adminPassword, 10);
            const admin = await tx.user.create({
                data: {
                    name: adminName,
                    email: adminEmail,
                    passwordHash,
                    role: 'admin',
                    tenantId: tenant.id
                }
            });

            return { tenant, admin };
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating tenant:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to create tenant' });
    }
};

/**
 * Update tenant details
 */
const updateTenant = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        const tenant = await prisma.tenant.update({
            where: { id },
            data: { name }
        });
        res.json(tenant);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update tenant' });
    }
};

/**
 * Update tenant status
 */
const updateTenantStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const tenant = await prisma.tenant.update({
            where: { id },
            data: { status }
        });
        res.json(tenant);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update tenant status' });
    }
};

/**
 * List all users across tenants
 */
const getGlobalUsers = async (req, res) => {
    try {
        const { role, tenantId, page = 1, limit = 15 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (role) where.role = role;
        if (tenantId) where.tenantId = tenantId;

        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    profilePic: true,
                    createdAt: true,
                    tenant: {
                        select: { id: true, name: true }
                    },
                    doctor: {
                        select: { id: true }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                currentPage: parseInt(page)
            }
        });
    } catch (error) {
        console.error('Error in getGlobalUsers:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Global appointment monitor
 */
const getGlobalAppointments = async (req, res) => {
    try {
        const { tenantId, status, startDate, endDate, page = 1, limit = 15 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (tenantId) where.tenantId = tenantId;
        // if (status) where.status = status; // Assuming status exists or derived
        if (startDate || endDate) {
            where.timeSlot = {
                date: {
                    gte: startDate ? new Date(startDate) : undefined,
                    lte: endDate ? new Date(endDate) : undefined
                }
            };
        }

        const [appointments, totalCount] = await Promise.all([
            prisma.appointment.findMany({
                where,
                include: {
                    tenant: { select: { id: true, name: true } },
                    doctor: {
                        select: {
                            id: true,
                            name: true,
                            user: { select: { profilePic: true } }
                        }
                    },
                    user: { select: { id: true, name: true, profilePic: true } },
                    timeSlot: { select: { startTime: true, date: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.appointment.count({ where })
        ]);

        res.json({
            appointments,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                currentPage: parseInt(page)
            }
        });
    } catch (error) {
        console.error('Error in getGlobalAppointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

/**
 * Platform analytics
 */
const getPlatformAnalytics = async (req, res) => {
    try {
        // Appointments per month (Prisma groupBy for months is better done with raw query or mapping in code for small scales)
        // Here we'll do basic aggregations for top performers

        const [topTenants, topDoctors] = await Promise.all([
            // Top 5 tenants by appointments
            prisma.appointment.groupBy({
                by: ['tenantId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5
            }),
            // Top 5 doctors by rating
            prisma.review.groupBy({
                by: ['doctorId'],
                _avg: { rating: true },
                _count: { id: true },
                having: { id: { _count: { gt: 0 } } },
                orderBy: { _avg: { rating: 'desc' } },
                take: 5
            })
        ]);

        // Hydrate the grouped data with names
        const hydratedTenants = await Promise.all(topTenants.map(async (t) => {
            const tenant = await prisma.tenant.findUnique({ where: { id: t.tenantId }, select: { name: true } });
            return { ...t, name: tenant?.name || 'Unknown' };
        }));

        const hydratedDoctors = await Promise.all(topDoctors.map(async (d) => {
            const doctor = await prisma.doctor.findUnique({ where: { id: d.doctorId }, select: { name: true, specialization: true } });
            return { ...d, name: doctor?.name || 'Unknown', specialization: doctor?.specialization };
        }));

        res.json({
            topTenants: hydratedTenants,
            topDoctors: hydratedDoctors
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

/**
 * Get detailed tenant information including doctor performance
 */
const getTenantDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        doctors: true,
                        users: true,
                        appointments: true,
                        reviews: true
                    }
                },
                doctors: {
                    include: {
                        user: {
                            select: { profilePic: true }
                        },
                        _count: {
                            select: { appointments: true }
                        },
                        reviews: {
                            select: { rating: true }
                        }
                    }
                },
                users: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        profilePic: true,
                        createdAt: true,
                        doctor: { select: { id: true } }
                    }
                }
            }
        });

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Calculate average rating for tenant
        const tenantAvgRating = await prisma.review.aggregate({
            where: { tenantId: id },
            _avg: { rating: true }
        });

        // Format doctors list with individual performance
        const doctors = tenant.doctors.map(doctor => {
            const totalRatings = doctor.reviews.length;
            const avgRating = totalRatings > 0
                ? parseFloat((doctor.reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(1))
                : 0;

            return {
                id: doctor.id,
                name: doctor.name,
                specialization: doctor.specialization,
                profilePic: doctor.user?.profilePic,
                appointments: doctor._count.appointments,
                averageRating: avgRating
            };
        });

        res.json({
            id: tenant.id,
            name: tenant.name,
            status: tenant.status,
            createdAt: tenant.createdAt,
            totalDoctors: tenant._count.doctors,
            totalUsers: tenant._count.users,
            totalAppointments: tenant._count.appointments,
            totalReviews: tenant._count.reviews,
            averageRating: tenantAvgRating._avg.rating ? parseFloat(tenantAvgRating._avg.rating.toFixed(1)) : 0,
            doctors,
            users: tenant.users
        });
    } catch (error) {
        console.error('Error fetching tenant details:', error);
        res.status(500).json({ error: 'Failed to fetch tenant details' });
    }
};

const getDoctorDetails = async (req, res) => {
    try {
        const { tenantId, doctorId } = req.params;

        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
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
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Validate doctor belongs to the tenant (lenient for Super Admin deep links)
        if (tenantId !== 'undefined' && doctor.tenantId !== tenantId) {
            return res.status(400).json({ error: 'Doctor does not belong to this tenant' });
        }

        // Calculate average rating
        const avgRatingAggregation = await prisma.review.aggregate({
            where: { doctorId },
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
        console.error('Error fetching doctor details:', error);
        res.status(500).json({ error: 'Failed to fetch doctor details' });
    }
};

/**
 * Get user specific details for super admin
 */
const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [user, reviewsCount, appointments, totalCount] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
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
            prisma.review.count({ where: { userId } }),
            prisma.appointment.findMany({
                where: { userId },
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
            prisma.appointment.count({ where: { userId } })
        ]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
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
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

module.exports = {
    getDashboardStats,
    getTenants,
    getTenantDetails,
    getDoctorDetails,
    getUserDetails,
    createTenant,
    updateTenant,
    updateTenantStatus,
    getGlobalUsers,
    getGlobalAppointments,
    getPlatformAnalytics
};
