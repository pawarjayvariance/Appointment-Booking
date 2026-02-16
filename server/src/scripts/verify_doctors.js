const http = require('http');

async function verifyDoctorsApi() {
    return new Promise((resolve) => {
        http.get('http://localhost:5000/api/doctors', (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log('Status Code:', res.statusCode);
                const data = JSON.parse(body);
                console.log('Doctors Count:', data.length);
                if (data.length > 0) {
                    console.log('First Doctor Name:', data[0].name);
                    console.log('User Object included:', !!data[0].user);
                    if (data[0].user) {
                        console.log('Profile Pic present:', 'profilePic' in data[0].user);
                    }
                }
                resolve();
            });
        }).on('error', (err) => {
            console.error('API Error:', err.message);
            resolve();
        });
    });
}

verifyDoctorsApi();
