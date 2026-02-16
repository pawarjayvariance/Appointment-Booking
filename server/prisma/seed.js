const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    console.log("Seeding doctors and users...");
    const hashedPassword = await bcrypt.hash('password123', 10);

    const doctorsData = [
        {
            id: "d1eb874d-7360-496e-a3ca-fc1556950285",
            email: "john.doe@hospital.com",
            name: "Dr. John Doe",
            specialization: "Cardiologist",
            timezone: "America/New_York",
            workingStart: "08:00",
            workingEnd: "16:00",
            slotDuration: 30,
            profilePic: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop"
        },
        {
            id: "e4f8a12b-9c3d-4e5f-b6a7-8d9c0e1f2a3b",
            email: "sarah.lee@hospital.com",
            name: "Dr. Sarah Lee",
            specialization: "Neurologist",
            timezone: "Asia/Kolkata",
            workingStart: "10:00",
            workingEnd: "18:00",
            slotDuration: 60,
            profilePic: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop"
        },
        {
            id: "c4f8a12b-9c3d-4e5f-b6a7-8d9c0e1f2a3b",
            email: "jane.smith@hospital.com",
            name: "Dr. Jane Smith",
            specialization: "Pediatrician",
            timezone: "Europe/London",
            workingStart: "09:00",
            workingEnd: "17:00",
            slotDuration: 45,
            profilePic: "https://images.unsplash.com/photo-1559839734-2b71f1536783?w=400&h=400&fit=crop"
        }
    ];

    for (const docData of doctorsData) {
        const { id, email, name, profilePic, ...docFields } = docData;

        // 1. Create or update User
        const user = await prisma.user.upsert({
            where: { email },
            update: { name, profilePic, role: 'doctor' },
            create: {
                name,
                email,
                passwordHash: hashedPassword, // Demo password
                role: 'doctor',
                profilePic
            }
        });

        // 2. Create or update Doctor
        const result = await prisma.doctor.upsert({
            where: { id },
            update: { ...docFields, userId: user.id, name },
            create: { id, ...docFields, userId: user.id, name }
        });

        console.log(`Upserted doctor: ${result.name} linked to user: ${user.email}`);
    }

    console.log("Seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });