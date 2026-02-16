const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed: Creating Super Admin...');

    const email = 'superadmin@example.com';
    const password = 'SuperSecurePassword123';
    const passwordHash = await bcrypt.hash(password, 10);

    const superAdmin = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'super_admin'
        },
        create: {
            name: 'System Super Admin',
            email,
            passwordHash,
            role: 'super_admin'
        }
    });

    console.log('✅ Super Admin created successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('IMPORTANT: Change this password after first login.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
