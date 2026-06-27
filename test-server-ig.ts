import { exec } from 'child_process';

async function test() {
    try {
        console.log("Starting server...");
        const server = exec('npx tsx server.ts');
        
        server.stdout.on('data', data => console.log(data.toString()));
        server.stderr.on('data', data => console.error(data.toString()));

        await new Promise(r => setTimeout(r, 4000));

        const res = await fetch('http://localhost:3000/api/ig-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://www.instagram.com/reel/DEZc6oSSg7E/' })
        });
        const data = await res.json();
        console.log("ig media result:", JSON.stringify(data, null, 2));

        server.kill();
    } catch (e) {
        console.error(e);
    }
}
test();
