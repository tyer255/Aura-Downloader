const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add loadingStatusMsg to state
content = content.replace(
  'const [loadingStep, setLoadingStep] = useState(0);',
  'const [loadingStep, setLoadingStep] = useState(0);\n  const [loadingStatusMsg, setLoadingStatusMsg] = useState<string | null>(null);'
);

// 2. Clear loadingStatusMsg in handleDownload
content = content.replace(
  'setLoadingStep(0);\n    setIsLoading(true);\n    setResult(null);',
  'setLoadingStep(0);\n    setIsLoading(true);\n    setResult(null);\n    setLoadingStatusMsg(null);'
);

// 3. Remove 28s safety timer in handleDownload since fetchWithTimeoutAndRetry now handles retries and long waits gracefully.
// And call fetchWithTimeoutAndRetry with callback
const oldHandleDownloadMiddle = `      // Hard safety timer: guarantee loading state clears after 28 seconds
      safetyTimer = setTimeout(() => {
        setIsLoading(false);
        setExtractionProgress(null);
        setResult({
          success: false,
          error: "Request timed out on background tab. Please tap Download again."
        });
      }, 28000);

      const res = await fetchWithTimeoutAndRetry('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      }, 22000, 1);

      if (safetyTimer) clearTimeout(safetyTimer);`;

const newHandleDownloadMiddle = `      const res = await fetchWithTimeoutAndRetry('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      }, 35000, 2, (msg) => {
        setLoadingStatusMsg(msg);
      });`;

content = content.replace(oldHandleDownloadMiddle, newHandleDownloadMiddle);

// 4. Update the "Processing Link..." UI to use the new status msg
const oldProcessingUi = `                <div className={clsx(
                  "text-center text-xs font-medium",
                  isLight ? "text-neutral-600 dark:text-neutral-400" : "text-white/80"
                )}>
                  Processing Link...
                </div>`;

const newProcessingUi = `                <div className={clsx(
                  "text-center text-xs font-medium",
                  isLight ? "text-neutral-600 dark:text-neutral-400" : "text-white/80"
                )}>
                  {loadingStatusMsg || "Processing Link..."}
                </div>`;

content = content.replace(oldProcessingUi, newProcessingUi);

fs.writeFileSync('src/App.tsx', content);
