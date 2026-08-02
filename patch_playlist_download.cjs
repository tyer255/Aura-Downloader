const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldFetch = `              const apiRes = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: item.url })
              });`;

const newFetch = `              const apiRes = await fetchWithTimeoutAndRetry('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: item.url })
              }, 25000, 2);`;

content = content.replace(oldFetch, newFetch);

fs.writeFileSync('src/App.tsx', content);
