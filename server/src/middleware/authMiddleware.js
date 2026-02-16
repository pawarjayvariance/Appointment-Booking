const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET;
/**
 * Middleware to protect routes by verifying the JWT token
 */
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token missing or malformed' });
    }
    const token = authHeader.split(' ')[1];
    // console.log("token ---> ",token);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, name: true, email: true, role: true, doctor: true, tenantId: true, tenant: true } // Include tenant details
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid token: User not found' });
        }

        // Check if tenant is suspended
        if (user.tenant && user.tenant.status === 'suspended' && user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Your tenant is suspended. Please contact Super Admin.' });
        }

        // Attach user and tenant info to the request object
        req.user = user;
        req.tenantId = user.tenantId;
        next();
    } catch (err) {
        console.error('JWT verification error:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/** 
 * Middleware to authorize specific roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action' });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    authorize
};
