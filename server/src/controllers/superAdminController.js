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
                    createdAt: true,
                    tenant: {
                        select: { name: true }
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
                    tenant: { select: { name: true } },
                    doctor: { select: { name: true } },
                    user: { select: { name: true } },
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

module.exports = {
    getDashboardStats,
    getTenants,
    createTenant,
    updateTenant,
    updateTenantStatus,
    getGlobalUsers,
    getGlobalAppointments,
    getPlatformAnalytics
};
