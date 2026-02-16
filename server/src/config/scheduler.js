const cron = require('node-cron');
const prisma = require('./prisma');
const { format, addDays, startOfToday, setHours, setMinutes, parse } = require('date-fns');

/**
 * Generates slots for a specific doctor or all doctors for the next 15 days.
 */
async function generateSlots(targetDoctorId = null) {
    const today = startOfToday();
    console.log(`--- Starting Slot Generation [Target: ${targetDoctorId || 'All'}] ---`);

    try {
        const query = targetDoctorId ? { where: { id: targetDoctorId } } : {};
        const doctors = await prisma.doctor.findMany(query);

        for (const doctor of doctors) {
            console.log(`Processing slots for Dr. ${doctor.name}`);

            for (let i = 0; i < 15; i++) {
                const targetDate = addDays(today, i);
                const [startH, startM] = doctor.workingStart.split(':').map(Number);
                const [endH, endM] = doctor.workingEnd.split(':').map(Number);

                let currentSlotTime = setMinutes(setHours(targetDate, startH), startM);
                const endLimit = setMinutes(setHours(targetDate, endH), endM);

                while (currentSlotTime < endLimit) {
                    const startTime = new Date(currentSlotTime);
                    const endTime = new Date(startTime.getTime() + doctor.slotDuration * 60000);

                    if (endTime > endLimit) break;

                    // Manual check to prevent duplicates
                    const exists = await prisma.timeSlot.findFirst({
                        where: {
                            doctorId: doctor.id,
                            startTime: startTime
                        }
                    });

                    if (!exists) {
                        await prisma.timeSlot.create({
                            data: {
                                doctor: { connect: { id: doctor.id } },
                                date: targetDate,
                                startTime: startTime,
                                endTime: endTime,
                                isBooked: false,
                                ...(doctor.tenantId && { tenant: { connect: { id: doctor.tenantId } } })
                            }
                        });
                    }

                    currentSlotTime = new Date(currentSlotTime.getTime() + doctor.slotDuration * 60000);
                }
            }
        }
        console.log('--- Slot Generation Completed ---');
    } catch (error) {
        console.error('Error in slot generation:', error);
    }
}

/**
 * Cleans up past unbooked slots.
 */
async function cleanupPastSlots() {
    console.log('--- Starting Past Slot Cleanup ---');
    try {
        const now = new Date();
        const deleted = await prisma.timeSlot.deleteMany({
            where: {
                startTime: {
                    lt: now
                },
                isBooked: false // Only delete unbooked slots to be safe
            }
        });
        console.log(`Deleted ${deleted.count} past unbooked slots.`);
    } catch (error) {
        console.error('Error in slot cleanup:', error);
    }
}

// Schedule tasks
// Runs every day at midnight
const initScheduler = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily maintenance tasks...');
        await cleanupPastSlots();
        await generateSlots();
    });

    // Run once on startup to ensure slots are ready
    setTimeout(async () => {
        console.log('Running initial maintenance check...');
        await cleanupPastSlots();
        await generateSlots();
    }, 5000);
};

module.exports = {
    initScheduler,
    generateSlots,
    cleanupPastSlots
};
