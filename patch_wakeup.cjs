const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldCode = `        // Reset stuck loading state if a request was stalled while tab or PWA was dormant
        setIsLoading(false);
        setExtractionProgress(null);
        fetchingRefs.current.clear();`;

const newCode = `        // Only reset if tab was dormant for over 15 minutes, otherwise it cancels active downloads
        if (now - lastActiveTimeRef.current > 15 * 60 * 1000) {
          setIsLoading(false);
          setExtractionProgress(null);
          fetchingRefs.current.clear();
        }`;

content = content.replace(oldCode, newCode);

fs.writeFileSync('src/App.tsx', content);
