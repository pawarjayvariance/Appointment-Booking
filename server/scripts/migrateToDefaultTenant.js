const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting data migration to default tenant...');

    // 1. Create Default Tenant
    const defaultTenant = await prisma.tenant.upsert({
        where: { id: 'default-tenant-id' }, // Using a fixed ID for consistency during migration
        update: {},
        create: {
            id: 'default-tenant-id',
            name: 'Default Clinic',
            status: 'active'
        }
    });

    console.log(`Default tenant created/found: ${defaultTenant.name} (${defaultTenant.id})`);

    // 2. Assign existing data to the default tenant
    const modelsToUpdate = ['user', 'doctor', 'appointment', 'review', 'timeSlot'];

    for (const modelName of modelsToUpdate) {
        const count = await prisma[modelName].updateMany({
            where: { tenantId: null },
            data: { tenantId: defaultTenant.id }
        });
        console.log(`Updated ${count.count} records in ${modelName} table.`);
    }

    console.log('Data migration completed successfully.');
}

main()
    .catch((e) => {
        console.error('Error during migration:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
