const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      // Simulate progress for preparing
      const interval = setInterval(() => {
         setActiveDownloads(prev => {
            const current = prev[url];
            if (current && current.status === "preparing") {
                const nextProg = Math.min((current.progress || 0) + 5, 95);
                return { ...prev, [url]: { ...current, progress: nextProg } };
            }
            return prev;
         });
      }, 500);

      try {
        const res = await fetchWithTimeoutAndRetry(url, {}, 35000, 2, (msg) => {
           setHistoryToast("Waking up server... (takes ~10 seconds)");
        });
        const data = await res.json();
        clearInterval(interval);`;

const replacement = `      try {
        let finalData: any = null;
        const sseUrl = url + (url.includes('?') ? '&' : '?') + 'sse=true';
        const eventSource = new EventSource(sseUrl);

        await new Promise<void>((resolve, reject) => {
          let timeout = setTimeout(() => {
            eventSource.close();
            reject(new Error("Timeout"));
          }, 35000);

          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.progress !== undefined) {
                 setActiveDownloads(prev => {
                    const current = prev[url];
                    if (current && current.status === "preparing") {
                        return { ...prev, [url]: { ...current, progress: data.progress } };
                    }
                    return prev;
                 });
                 if (data.message) setHistoryToast(data.message);
              }
              if (data.success !== undefined || data.error !== undefined) {
                 finalData = data;
                 clearTimeout(timeout);
                 eventSource.close();
                 resolve();
              }
            } catch (err) {}
          };

          eventSource.onerror = (err) => {
            clearTimeout(timeout);
            eventSource.close();
            reject(new Error("SSE Error"));
          };
        });

        const data = finalData;
`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx with SSE support!");
} else {
  console.log("Target not found!");
}
