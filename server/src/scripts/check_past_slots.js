const prisma = require('./src/services/prisma');
const { startOfToday } = require('date-fns');

async function check() {
    const now = new Date();
    const today = startOfToday();

    console.log(`Current time (now): ${now.toISOString()}`);
    console.log(`Start of today: ${today.toISOString()}`);

    const pastSlotsInclusive = await prisma.timeSlot.findMany({
        where: {
            startTime: {
                lt: now
            },
            isBooked: false
        }
    });

    const pastSlotsStrictToday = await prisma.timeSlot.findMany({
        where: {
            startTime: {
                lt: today
            },
            isBooked: false
        }
    });

    console.log(`Unbooked slots before NOW: ${pastSlotsInclusive.length}`);
    console.log(`Unbooked slots before TODAY (start): ${pastSlotsStrictToday.length}`);

    if (pastSlotsInclusive.length > 0) {
        console.log('Sample past slot before NOW:');
        console.log({
            id: pastSlotsInclusive[0].id,
            startTime: pastSlotsInclusive[0].startTime.toISOString(),
            isBooked: pastSlotsInclusive[0].isBooked
        });
    }

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
