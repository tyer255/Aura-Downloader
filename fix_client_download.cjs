const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const downloadFileClientSide = async \(url: string, filename: string\) => \{[\s\S]*?\};/m;
const newCode = `const downloadFileClientSide = async (url: string, filename: string) => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    
    requestNotificationPermission();

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

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Replaced downloadFileClientSide");
} else {
    console.log("Could not find downloadFileClientSide");
}
