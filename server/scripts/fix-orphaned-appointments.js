const prisma = require('../src/services/prisma');

async function checkOrphanedAppointments() {
    try {
        const count = await prisma.appointment.count({
            where: { userId: null }
        });

        console.log(`Found ${count} appointments without userId`);

        if (count > 0) {
            console.log('\nOrphaned appointments exist. Creating system user...');

            // Create system user
            const systemUser = await prisma.user.upsert({
                where: { email: 'system@booking.internal' },
                update: {},
                create: {
                    name: 'System',
                    email: 'system@booking.internal',
                    passwordHash: 'N/A',
                    role: 'admin'
                }
            });

            console.log(`System user created: ${systemUser.id}`);

            // Assign orphaned appointments
            const result = await prisma.appointment.updateMany({
                where: { userId: null },
                data: { userId: systemUser.id }
            });

            console.log(`✓ Assigned ${result.count} orphaned appointments to system user`);
        } else {
            console.log('✓ No orphaned appointments found. Safe to proceed with migration.');
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkOrphanedAppointments();
