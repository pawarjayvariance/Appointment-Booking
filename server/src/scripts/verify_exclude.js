const http = require('http');

async function verifyExcludeUser() {
    const doctorId = "d1eb874d-7360-496e-a3ca-fc1556950285"; // Dr. John Doe
    const userIdToExclude = "750d78d7-06cd-429d-bae6-b4e5063b4c89"; // Test User from verify_summary output

    console.log(`Verifying exclusion of userId: ${userIdToExclude}`);

    return new Promise((resolve) => {
        http.get(`http://localhost:5000/api/doctors/${doctorId}/reviews-summary?excludeUser=${userIdToExclude}`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const data = JSON.parse(body);
                console.log('Status Code:', res.statusCode);
                console.log('Total reviews returned:', data.latestReviews.length);
                const containsExcluded = data.latestReviews.some(r => r.userId === userIdToExclude);
                console.log('Contains excluded user review:', containsExcluded);
                if (containsExcluded) {
                    console.error('FAILED: Excluded user review was found in the list');
                } else {
                    console.log('SUCCESS: Excluded user review was correctly filtered out');
                }
                resolve();
            });
        }).on('error', (err) => {
            console.error('API Error:', err.message);
            resolve();
        });
    });
}

verifyExcludeUser();
