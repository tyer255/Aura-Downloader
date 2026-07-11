const { exec } = require('child_process');

exec('curl -X POST http://localhost:3000/api/download -H "Content-Type: application/json" -d \'{"url": "https://www.youtube.com/@MrBeast"}\'', (err, stdout, stderr) => {
    console.log(stdout);
});
