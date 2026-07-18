const { exec } = require('child_process');

exec(`pinterest-dl scrape "https://www.pinterest.com/pin/28851253859769811/" --json`, { cwd: '/tmp/pinterest-dl' }, (err, stdout, stderr) => {
    console.log(stdout);
});
