const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the fake progress effect
const effectToRemove = `  // Smooth dynamic progress bar crawler up to 99%
  React.useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }
    if (progress >= 99) return;

    let delay = 100;
    if (progress < 30) {
      delay = 120; // fast start
    } else if (progress < 65) {
      delay = 180; // moderate crawl
    } else if (progress < 85) {
      delay = 320; // slower crawl
    } else {
      delay = 600; // ultra slow crawl up to 99%
    }

    const timer = setTimeout(() => {
      setProgress((prev) => {
        let increment = 0;
        if (prev < 30) {
          increment = Math.floor(Math.random() * 3) + 2;
        } else if (prev < 65) {
          increment = Math.random() > 0.25 ? 1 : 0;
        } else if (prev < 85) {
          increment = Math.random() > 0.55 ? 1 : 0;
        } else {
          increment = Math.random() > 0.85 ? 1 : 0;
        }
        return Math.min(prev + increment, 99);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoading, progress]);

  // Simulate dynamic download speed
  React.useEffect(() => {
    if (!isLoading) {
      setDownloadSpeed('0.0 MB/s');
      return;
    }
    const interval = setInterval(() => {
      setDownloadSpeed((Math.random() * 3 + 1.5).toFixed(1) + ' MB/s');
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading]);`;

if (code.includes(effectToRemove)) {
  code = code.replace(effectToRemove, '');
}

// Modify the loading UI
const loadingUITarget = `                {/* Status / Percentage Row */}
                <div className="w-full flex justify-between items-center px-1 mb-3">
                  <span className={clsx("text-sm font-medium transition-colors", isLight ? "text-neutral-700" : "text-neutral-300")}>Processing request...</span>
                  <span className={clsx("text-sm font-bold font-mono transition-colors", isLight ? "text-neutral-700" : "text-neutral-300")}>{progress}%</span>
                </div>

                {/* Shiny Blue Progress Bar Track */}
                <div className={clsx(
                  "w-full h-3 rounded-full overflow-hidden mb-4 shadow-inner transition-colors relative", 
                  isLight ? "bg-neutral-200" : "bg-neutral-800/80"
                )}>
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out bg-blue-500 overflow-hidden shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                    style={{ width: \`\${progress}%\` }}
                  >
                    {/* Shiny inner sheen effect */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent" />
                  </div>
                </div>

                {/* Dynamic Remaining Time & Speed */}
                <div className="flex justify-between items-center w-full text-xs text-neutral-500 font-medium mb-4 px-1">
                  <span>~\${secondsRemaining}s remaining</span>
                  <span className="font-mono">{progress < 99 ? downloadSpeed : '0.0 MB/s'}</span>
                </div>`;

const newLoadingUI = `                {/* Status / Percentage Row */}
                <div className="w-full flex justify-between items-center px-1 mb-3">
                  <span className={clsx("text-sm font-medium transition-colors", isLight ? "text-neutral-700" : "text-neutral-300")}>Extracting media details...</span>
                </div>

                {/* Indeterminate Scanning Bar */}
                <div className={clsx(
                  "w-full h-3 rounded-full overflow-hidden mb-4 shadow-inner transition-colors relative", 
                  isLight ? "bg-neutral-200" : "bg-neutral-800/80"
                )}>
                  <motion.div 
                    className="absolute top-0 left-0 h-full w-1/3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                    animate={{
                      x: ["-100%", "300%"],
                    }}
                    transition={{
                      repeat: Infinity,
                      ease: "linear",
                      duration: 1.5,
                    }}
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                  </motion.div>
                </div>`;

if (code.includes(loadingUITarget)) {
  code = code.replace(loadingUITarget, newLoadingUI);
}

const linesToRemove = [
  "const secondsRemaining = Math.max(1, Math.ceil((100 - progress) / 10));"
];

for (const line of linesToRemove) {
  if (code.includes(line)) {
    code = code.replace(line, '');
  }
}

// Ensure the download progress works for actual file downloading client side too
const downloadTarget = `  const downloadFileClientSide = async (url: string, filename: string) => {
    try {
      setHistoryToast("Starting download... Please wait.");
      setTimeout(() => setHistoryToast(null), 3000);

      const fetchUrl = \`/api/proxy-download?url=\${encodeURIComponent(url)}&filename=\${encodeURIComponent(filename)}\`;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        setHistoryToast("Download failed (Server Error).");
        setTimeout(() => setHistoryToast(null), 3000);
        return;
      }
      
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename || 'download';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
          window.URL.revokeObjectURL(objectUrl);
      }, 1000);
      
      setHistoryToast("Download complete!");
      setTimeout(() => setHistoryToast(null), 3000);
    } catch (error) {
      console.error('Download setup failed:', error);
      setHistoryToast("Download failed.");
      setTimeout(() => setHistoryToast(null), 3000);
    }
  };`;

const newDownload = `  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const downloadFileClientSide = async (url: string, filename: string) => {
    try {
      setDownloadProgress(0);
      setHistoryToast("Starting download...");

      const fetchUrl = \`/api/proxy-download?url=\${encodeURIComponent(url)}&filename=\${encodeURIComponent(filename)}\`;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        setHistoryToast("Download failed (Server Error).");
        setTimeout(() => setHistoryToast(null), 3000);
        setDownloadProgress(null);
        return;
      }

      const contentLength = response.headers.get('content-length') || response.headers.get('estimated-content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (total) {
            setDownloadProgress(Math.round((loaded / total) * 100));
          }
        }
      }

      const blob = new Blob(chunks);
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename || 'download';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
          window.URL.revokeObjectURL(objectUrl);
      }, 1000);
      
      setDownloadProgress(null);
      setHistoryToast("Download complete!");
      setTimeout(() => setHistoryToast(null), 3000);
    } catch (error) {
      console.error('Download setup failed:', error);
      setDownloadProgress(null);
      setHistoryToast("Download failed.");
      setTimeout(() => setHistoryToast(null), 3000);
    }
  };`;

if (code.includes(downloadTarget)) {
  code = code.replace(downloadTarget, newDownload);
}

// Find historyToast display to inject the download progress
const historyToastTarget = `      {/* History Actions Toast / Global Feedback */}
      <AnimatePresence>
        {historyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-neutral-900/90 text-white rounded-full shadow-2xl backdrop-blur-md border border-white/10 font-medium text-sm flex items-center gap-3"
          >
            {historyToast.includes("Starting download") ? <Download className="w-4 h-4 animate-bounce" /> : <Info className="w-4 h-4 text-emerald-400" />}
            {historyToast}
          </motion.div>
        )}
      </AnimatePresence>`;

const newHistoryToast = `      {/* History Actions Toast / Global Feedback */}
      <AnimatePresence>
        {historyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-neutral-900/90 text-white rounded-full shadow-2xl backdrop-blur-md border border-white/10 font-medium text-sm flex items-center gap-3"
          >
            {historyToast.includes("Starting download") ? <Download className="w-4 h-4 animate-bounce" /> : <Info className="w-4 h-4 text-emerald-400" />}
            {historyToast}
            {downloadProgress !== null && (
               <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-xs ml-2">{downloadProgress}%</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>`;

if (code.includes(historyToastTarget)) {
  code = code.replace(historyToastTarget, newHistoryToast);
}

fs.writeFileSync('src/App.tsx', code);
console.log("Patched successfully!");
