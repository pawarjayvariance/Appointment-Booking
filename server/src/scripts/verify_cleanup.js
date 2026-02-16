const { cleanupPastSlots } = require('./src/services/scheduler');
const prisma = require('./src/services/prisma');

async function verify() {
    console.log("--- Starting Cleanup Verification ---");

    // Check count before
    const beforeCount = await prisma.timeSlot.count({
        where: {
            startTime: {
                lt: new Date()
            },
            isBooked: false
        }
    });
    console.log(`Unbooked slots before cleanup: ${beforeCount}`);

    // Run cleanup
    await cleanupPastSlots();

    // Check count after
    const afterCount = await prisma.timeSlot.count({
        where: {
            startTime: {
                lt: new Date()
            },
            isBooked: false
        }
    });
    console.log(`Unbooked slots after cleanup: ${afterCount}`);

    if (afterCount === 0 && beforeCount > 0) {
        console.log("SUCCESS: Past unbooked slots were successfully deleted!");
    } else if (afterCount === 0 && beforeCount === 0) {
        console.log("NOTE: No past unbooked slots were found to delete, but cleanup ran.");
    } else {
        console.log("FAILURE: Some past unbooked slots still remain.");
    }

    process.exit(0);
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
