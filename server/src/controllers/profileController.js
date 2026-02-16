const prisma = require('../config/prisma');
const Joi = require('joi');

const profileController = {
    getProfile: async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    profilePic: true,
                    createdAt: true
                }
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(user);
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Internal server error: ' + error.message });
        }
    },

    updateProfile: async (req, res) => {

        const schema = Joi.object({
            name: Joi.string().min(2).max(50).required(),
            profilePic: Joi.string().allow(null, '', 'undefined').optional()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        try {
            let finalProfilePic = value.profilePic;

            // Clean up 'undefined' string if sent from frontend
            if (finalProfilePic === 'undefined') {
                finalProfilePic = null;
            }

            // If a file was uploaded, use its path instead
            if (req.file) {
                // Construct URL: http://host:port/public/uploads/profiles/filename
                const baseUrl = `${req.protocol}://${req.get('host')}`;
                finalProfilePic = `${baseUrl}/public/uploads/profiles/${req.file.filename}`;
            }

            const updatedUser = await prisma.user.update({
                where: { id: req.user.id },
                data: {
                    name: value.name,
                    profilePic: finalProfilePic
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    profilePic: true
                }
            });

            res.json({
                message: 'Profile updated successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Internal server error: ' + error.message });
        }
    }
};

module.exports = profileController;


