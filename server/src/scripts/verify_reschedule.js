const API_BASE = 'http://localhost:5000/api';

async function verifyReschedule() {
    console.log('--- Reschedule Feature Verification (Fetch) ---');

    try {
        // 1. Register/Login User A
        const userA = { name: 'User A', email: `usera_${Date.now()}@example.com`, password: 'password123' };
        await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userA)
        });

        const loginResA = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userA.email, password: userA.password })
        });
        const loginDataA = await loginResA.json();
        const tokenA = loginDataA.token;
        const authA = { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' };

        // 2. Register/Login User B
        const userB = { name: 'User B', email: `userb_${Date.now()}@example.com`, password: 'password123' };
        await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userB)
        });

        const loginResB = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userB.email, password: userB.password })
        });
        const loginDataB = await loginResB.json();
        const tokenB = loginDataB.token;
        const authB = { Authorization: `Bearer ${tokenB}`, 'Content-Type': 'application/json' };

        // 3. Get Doctors and Slots
        const doctorsRes = await fetch(`${API_BASE}/doctors`);
        const doctors = await doctorsRes.json();
        const doctorId = doctors[0].id;

        const date = new Date().toISOString().split('T')[0];
        const slotsRes = await fetch(`${API_BASE}/slots?date=${date}`);
        const slots = await slotsRes.json();
        const availableSlots = slots.filter(s => !s.isBooked);

        if (availableSlots.length < 2) {
            console.log('Not enough slots to test. Ending.');
            return;
        }

        const slot1 = availableSlots[0];
        const slot2 = availableSlots[1];

        // 4. User A books Slot 1
        console.log('User A booking Slot 1...');
        const bookingRes = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: authA,
            body: JSON.stringify({
                doctorId,
                timeSlotId: slot1.id,
                phone: '1234567890',
                gender: 'male',
                dob: '1990-01-01',
                address: '123 Street'
            })
        });
        const bookingData = await bookingRes.json();
        if (!bookingData.appointment) throw new Error(`Booking failed: ${JSON.stringify(bookingData)}`);
        const apptId = bookingData.appointment.id;

        // 5. Verify User B CANNOT reschedule User A's appointment
        console.log('Verifying User B cannot reschedule User A\'s appointment...');
        const failRes = await fetch(`${API_BASE}/appointments/${apptId}/reschedule`, {
            method: 'PATCH',
            headers: authB,
            body: JSON.stringify({ newTimeSlotId: slot2.id })
        });
        const failData = await failRes.json();
        if (failRes.status === 403) {
            console.log(`SUCCESS: User B blocked. Error: ${failData.error}`);
        } else {
            console.error(`FAIL: User B was able to reschedule! Status: ${failRes.status}`);
        }

        // 6. User A reschedules to Slot 2
        console.log('User A rescheduling to Slot 2...');
        const reschRes = await fetch(`${API_BASE}/appointments/${apptId}/reschedule`, {
            method: 'PATCH',
            headers: authA,
            body: JSON.stringify({ newTimeSlotId: slot2.id })
        });
        const reschData = await reschRes.json();
        if (reschRes.ok) {
            console.log(`SUCCESS: ${reschData.message}`);
        } else {
            console.error(`FAIL: Reschedule failed: ${reschData.error}`);
        }

        // 7. Verify Slot 1 is now free and Slot 2 is booked
        console.log('Verifying slot states...');
        const finalSlotsRes = await fetch(`${API_BASE}/slots?date=${date}`);
        const finalSlots = await finalSlotsRes.json();
        const s1 = finalSlots.find(s => s.id === slot1.id);
        const s2 = finalSlots.find(s => s.id === slot2.id);

        if (!s1.isBooked && s2.isBooked) {
            console.log('SUCCESS: Slot 1 is free, Slot 2 is booked.');
        } else {
            console.error(`FAIL: Unexpected slot states. S1 booked: ${s1.isBooked}, S2 booked: ${s2.isBooked}`);
        }

    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

verifyReschedule();
