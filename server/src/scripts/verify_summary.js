const http = require('http');

async function verifySummaryApi() {
    const doctorId = "d1eb874d-7360-496e-a3ca-fc1556950285"; // Dr. John Doe
    return new Promise((resolve) => {
        http.get(`http://localhost:5000/api/doctors/${doctorId}/reviews-summary`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log('Status Code:', res.statusCode);
                const data = JSON.parse(body);
                console.log('Summary Data:', JSON.stringify(data, null, 2));
                resolve();
            });
        }).on('error', (err) => {
            console.error('API Error:', err.message);
            resolve();
        });
    });
}

verifySummaryApi();
