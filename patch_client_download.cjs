const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldFetch = `        const res = await fetch(url);
        const data = await res.json();
        clearInterval(interval);`;

const newFetch = `        const res = await fetchWithTimeoutAndRetry(url, {}, 35000, 2, (msg) => {
           setHistoryToast("Waking up server... (takes ~10 seconds)");
        });
        const data = await res.json();
        clearInterval(interval);`;

content = content.replace(oldFetch, newFetch);

fs.writeFileSync('src/App.tsx', content);
