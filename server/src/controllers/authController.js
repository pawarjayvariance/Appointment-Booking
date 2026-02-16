const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Register a new user
 */
const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                tenantId: req.body.tenantId || 'default-tenant-id' // Assign to default tenant if not provided
            }
        });

        res.status(201).json({
            message: 'User registered successfully. Please sign in to continue.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
};

/**
 * Login an existing user
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, tenantId: user.tenantId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const userWithDetails = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                doctor: true,
                tenant: {
                    select: { name: true }
                }
            }
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: userWithDetails.id,
                name: userWithDetails.name,
                email: userWithDetails.email,
                role: userWithDetails.role,
                tenant: userWithDetails.tenant
            },
            doctor: userWithDetails.doctor
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error during login' });
    }
};

module.exports = {
    register,
    login
};
