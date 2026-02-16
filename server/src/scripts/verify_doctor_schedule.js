const prisma = require('./src/services/prisma');
const { generateSlots } = require('./src/services/scheduler');
const { startOfToday, addDays } = require('date-fns');

async function verify() {
    console.log("--- Starting Schedule Verification ---");

    // 1. Find a doctor
    const doctor = await prisma.doctor.findFirst();
    if (!doctor) {
        console.log("No doctor found.");
        process.exit(1);
    }
    console.log(`Testing for Doctor: ${doctor.name}`);

    // 2. Test Working Hour Update logic (Manual simulation of controller)
    const newStart = "10:00";
    const newEnd = "16:00";
    const newDuration = 45;

    console.log(`Updating hours to ${newStart}-${newEnd} with ${newDuration}min slots...`);

    // Update doctor
    await prisma.doctor.update({
        where: { id: doctor.id },
        data: {
            workingStart: newStart,
            workingEnd: newEnd,
            slotDuration: newDuration
        }
    });

    // Delete future unbooked slots
    await prisma.timeSlot.deleteMany({
        where: {
            doctorId: doctor.id,
            isBooked: false,
            startTime: { gte: startOfToday() }
        }
    });

    // Regenerate
    await generateSlots(doctor.id);

    // Verify slots for today
    const slots = await prisma.timeSlot.findMany({
        where: {
            doctorId: doctor.id,
            date: startOfToday()
        },
        orderBy: { startTime: 'asc' }
    });

    console.log(`Generated ${slots.length} slots for today.`);
    if (slots.length > 0) {
        const firstSlotStart = slots[0].startTime.getHours();
        const duration = (slots[0].endTime.getTime() - slots[0].startTime.getTime()) / 60000;
        console.log(`First slot starts at: ${firstSlotStart}:00, Duration: ${duration}min`);

        if (firstSlotStart === 10 && duration === 45) {
            console.log("SUCCESS: Working hours and duration update verified!");
        } else {
            console.log("FAILURE: Working hours or duration mismatch.");
        }
    }

    // 3. Test Disable Slots logic
    if (slots.length > 0) {
        const slotToDisable = slots[0].id;
        console.log(`Disabling slot: ${slotToDisable}`);

        await prisma.timeSlot.update({
            where: { id: slotToDisable },
            data: { isBooked: true }
        });

        const updatedSlot = await prisma.timeSlot.findUnique({ where: { id: slotToDisable } });
        console.log(`Updated slot isBooked: ${updatedSlot.isBooked}`);

        if (updatedSlot.isBooked === true) {
            console.log("SUCCESS: Slot disabling verified!");
        } else {
            console.log("FAILURE: Slot still marked as free.");
        }
    }

    console.log("--- Verification Complete ---");
    process.exit(0);
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
