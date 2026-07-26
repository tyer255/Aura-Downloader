const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldFuncStart = `  const downloadFileClientSide = async (url: string, filename: string) => {`;
const oldFuncRegex = /const downloadFileClientSide = async \(url: string, filename: string\) => \{[\s\S]*? setTimeout\(\(\) => setHistoryToast\(null\), 3000\);\n  \};/m;

const newFunc = `  const downloadFileClientSide = async (url: string, filename: string) => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    
    requestNotificationPermission();

    if (url.startsWith("/api/get-youtube-link")) {
      setActiveDownloads(prev => ({
        ...prev,
        [url]: { filename, progress: 0, status: "preparing" }
      }));
      setHistoryToast("Preparing YouTube stream... (takes ~10 seconds)");
      
      // Simulate progress for preparing
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
        const res = await fetch(url);
        const data = await res.json();
        clearInterval(interval);
        
        if (data && data.url) {
           const proxyUrl = \`/api/proxy-download?url=\${encodeURIComponent(data.url)}&filename=\${encodeURIComponent(filename)}\`;
           const a = document.createElement('a');
           a.href = proxyUrl;
           a.download = filename || 'download';
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           
           setActiveDownloads(prev => ({
             ...prev,
             [url]: { filename, progress: 100, status: "complete" }
           }));
           setHistoryToast("Download started!");
           setTimeout(() => {
              setActiveDownloads(prev => {
                const next = { ...prev };
                delete next[url];
                return next;
              });
           }, 3000);
        } else {
           throw new Error("Failed to resolve link");
        }
      } catch (err) {
           clearInterval(interval);
           setActiveDownloads(prev => ({
             ...prev,
             [url]: { filename, progress: null, status: "failed" }
           }));
           setHistoryToast("Failed to prepare video stream.");
           setTimeout(() => {
              setActiveDownloads(prev => {
                const next = { ...prev };
                delete next[url];
                return next;
              });
           }, 3000);
      }
      return;
    }

    const fetchUrl = url.startsWith("/api/proxy-download") || url.startsWith("/api/youtube-stream") 
      ? url 
      : \`/api/proxy-download?url=\${encodeURIComponent(url)}&filename=\${encodeURIComponent(filename)}\`;
    const throttleParam = throttleSetting !== "unlimited" ? \`&throttle=\${throttleSetting}\` : "";
    const finalFetchUrl = fetchUrl.includes("?") ? \`\${fetchUrl}\${throttleParam}\` : \`\${fetchUrl}?\${throttleParam}\`;

    const a = document.createElement('a');
    a.href = finalFetchUrl;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setHistoryToast("Download started!");
    setTimeout(() => setHistoryToast(null), 3000);
  };`;

if (oldFuncRegex.test(code)) {
    code = code.replace(oldFuncRegex, newFunc);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Updated downloadFileClientSide in App.tsx");
} else {
    console.log("Could not find downloadFileClientSide in App.tsx");
}
