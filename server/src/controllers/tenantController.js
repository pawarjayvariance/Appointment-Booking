const prisma = require('../config/prisma');

/**
 * Get all tenants (Super Admin only)
 */
const getTenants = async (req, res) => {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        doctors: true,
                        appointments: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(tenants);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ error: 'Failed to fetch tenants' });
    }
};

/**
 * Create a new tenant (Super Admin only)
 */
const createTenant = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Tenant name is required' });
    }

    try {
        const tenant = await prisma.tenant.create({
            data: {
                name,
                status: 'active'
            }
        });

        res.status(201).json(tenant);
    } catch (error) {
        console.error('Error creating tenant:', error);
        res.status(500).json({ error: 'Failed to create tenant' });
    }
};

/**
 * Update tenant status (Super Admin only)
 */
const updateTenantStatus = async (req, res) => {
    const { tenantId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "active" or "suspended"' });
    }

    try {
        const tenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { status }
        });

        res.json(tenant);
    } catch (error) {
        console.error('Error updating tenant status:', error);
        res.status(500).json({ error: 'Failed to update tenant status' });
    }
};

/**
 * Get tenant statistics (Super Admin only)
 */
const getTenantStats = async (req, res) => {
    try {
        const tenantCount = await prisma.tenant.count();
        const activeTenantCount = await prisma.tenant.count({ where: { status: 'active' } });
        const totalAppointments = await prisma.appointment.count();

        res.json({
            totalTenants: tenantCount,
            activeTenants: activeTenantCount,
            suspendedTenants: tenantCount - activeTenantCount,
            totalAppointments
        });
    } catch (error) {
        console.error('Error fetching tenant stats:', error);
        res.status(500).json({ error: 'Failed to fetch tenant statistics' });
    }
};

module.exports = {
    getTenants,
    createTenant,
    updateTenantStatus,
    getTenantStats
};
