const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldCode = `        const now = Date.now();
        lastActiveTimeRef.current = now;

        // Only reset if tab was dormant for over 15 minutes, otherwise it cancels active downloads
        if (now - lastActiveTimeRef.current > 15 * 60 * 1000) {`;

const newCode = `        const now = Date.now();
        const timeSinceLastActive = now - lastActiveTimeRef.current;
        lastActiveTimeRef.current = now;

        // Only reset if tab was dormant for over 15 minutes, otherwise it cancels active downloads
        if (timeSinceLastActive > 15 * 60 * 1000) {`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/App.tsx', content);
