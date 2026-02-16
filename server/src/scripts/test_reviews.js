const http = require('http');

const request = (options, data) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
};

async function verifyReviewFeature() {
    const timestamp = Date.now();
    const email = `testuser_${timestamp}@example.com`;
    const password = 'password123';

    try {
        console.log('1. Registering user...');
        const regRes = await request({
            hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { name: 'Test User', email, password });
        console.log('Register:', regRes.statusCode);

        console.log('2. Logging in...');
        const loginRes = await request({
            hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email, password });
        const token = loginRes.data.token;
        console.log('Login:', loginRes.statusCode);
        
        console.log('3. Getting doctors...');
        const doctorsRes = await request({
            hostname: 'localhost', port: 5000, path: '/api/doctors', method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const doctor = doctorsRes.data[0];
        if (!doctor) throw new Error('No doctors found');
        console.log('Doctor found:', doctor.name, 'ID:', doctor.id);

        console.log('5. Getting slots to book...');
        const todayStr = '2026-02-11';
        const slotsRes = await request({
            hostname: 'localhost', port: 5000, path: `/api/doctors/${doctor.id}/slots?date=${todayStr}`, method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const slot = slotsRes.data.find(s => !s.isBooked);
        if (!slot) throw new Error('No slots');
        console.log('Slot found:', slot.id);

        console.log('6. Booking appointment...');
        const bookRes = await request({
            hostname: 'localhost', port: 5000, path: '/api/bookings', method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }, {
            doctorId: doctor.id,
            timeSlotId: slot.id,
            note: 'Testing review',
            phone: '1234567890',
            gender: 'male',
            dob: '1990-01-01',
            address: '123 Test St'
        });
        console.log('Booking:', bookRes.statusCode);

        console.log('7. Submitting review (Should now succeed)...');
        const successReviewRes = await request({
            hostname: 'localhost', port: 5000, path: '/api/reviews', method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }, { doctorId: doctor.id, rating: 5, feedback: 'Excellent' });
        console.log('Success Review:', successReviewRes.statusCode, successReviewRes.data);

        console.log('9. Fetching all reviews for doctor...');
        const allReviewsRes = await request({
            hostname: 'localhost', port: 5000, path: `/api/doctor/reviews?doctorId=${doctor.id}`, method: 'GET'
        });
        console.log('Reviews Count in List:', allReviewsRes.data.totalRecords);
        console.log('First Review Patient:', allReviewsRes.data.data[0].user.name);

        console.log('VERIFICATION COMPLETE SUCCESS');
    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

verifyReviewFeature();
