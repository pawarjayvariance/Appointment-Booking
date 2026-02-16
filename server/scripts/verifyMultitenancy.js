const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    console.log('--- Starting Multi-Tenancy Verification ---');

    // 1. Check Default Tenant
    const defaultTenant = await prisma.tenant.findUnique({ where: { id: 'default-tenant-id' } });
    if (defaultTenant) {
        console.log('✅ Default tenant exists');
    } else {
        console.error('❌ Default tenant missing');
    }

    // 2. Check Data Association
    const usersWithoutTenant = await prisma.user.count({ where: { tenantId: null } });
    if (usersWithoutTenant === 0) {
        console.log('✅ All users are assigned to a tenant');
    } else {
        console.error(`❌ ${usersWithoutTenant} users are not assigned to a tenant`);
    }

    // 3. Create a Test Tenant
    const testTenant = await prisma.tenant.upsert({
        where: { id: 'test-tenant-id' },
        update: {},
        create: {
            id: 'test-tenant-id',
            name: 'Test Clinic',
            status: 'active'
        }
    });
    console.log('✅ Test tenant created');

    // 4. Create a Test User in Test Tenant
    const testUser = await prisma.user.upsert({
        where: { email: 'test@tenant.com' },
        update: { tenantId: testTenant.id },
        create: {
            name: 'Test User',
            email: 'test@tenant.com',
            passwordHash: 'dummy',
            role: 'user',
            tenantId: testTenant.id
        }
    });
    console.log('✅ Test user created in test tenant');

    // 5. Verify Isolation (Simple check)
    const appointmentsInDefault = await prisma.appointment.count({ where: { tenantId: 'default-tenant-id' } });
    const appointmentsInTest = await prisma.appointment.count({ where: { tenantId: 'test-tenant-id' } });

    console.log(`- Appointments in Default: ${appointmentsInDefault}`);
    console.log(`- Appointments in Test: ${appointmentsInTest}`);

    if (appointmentsInTest === 0) {
        console.log('✅ Isolation test passed: Test tenant has 0 appointments initially');
    }

    // 6. Test Super Admin Role existance in Enum
    // (Checked during migration, but verifying logic if we were to query it)
    const superAdmins = await prisma.user.count({ where: { role: 'super_admin' } });
    console.log(`- Number of Super Admins: ${superAdmins}`);

    console.log('--- Verification Completed ---');
}

verify()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
