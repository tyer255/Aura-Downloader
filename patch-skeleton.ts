import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldSkeleton = `          {isLoading && (() => {
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="w-full max-w-md mx-auto flex flex-col items-center mt-4"
              >
                {/* Central Card with Spinner */}
                <div className={clsx(
                  "w-full aspect-square border rounded-[36px] flex items-center justify-center shadow-[0_25px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative mb-8 overflow-hidden transition-colors",
                  isLight ? "bg-white border-neutral-200" : "bg-[#1e1315]/70 border-[#301618]"
                )}>
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className={clsx("absolute inset-0 border-4 rounded-full", isLight ? "border-neutral-200" : "border-neutral-800/60")}></div>
                    <div className={clsx("absolute inset-0 border-4 rounded-full animate-spin", isLight ? "border-t-neutral-800" : "border-t-neutral-400/80")}></div>
                  </div>
                </div>

                {/* Status / Percentage Row */}
                <div className="w-full flex justify-between items-center px-1 mb-3">
                  <span className={clsx("text-sm font-medium transition-colors", isLight ? "text-neutral-700" : "text-neutral-300")}>
                    Extracting media details...
                  </span>
                  <span className="text-sm font-bold text-blue-500">
                    {LOADING_STEPS[loadingStep].target}%
                  </span>
                </div>

                {/* Determinate Progress Bar */}
                <div className={clsx(
                  "w-full h-3 rounded-full overflow-hidden mb-4 shadow-inner transition-colors relative", 
                  isLight ? "bg-neutral-200" : "bg-neutral-800/80"
                )}>
                  <motion.div 
                    className="absolute top-0 left-0 h-full rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                    initial={{ width: "0%" }}
                    animate={{ width: \`\${LOADING_STEPS[loadingStep].target}%\` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                {/* Status message */}
                <div className={clsx("text-sm font-semibold tracking-wide transition-colors", isLight ? "text-neutral-600" : "text-neutral-400")}>
                  {LOADING_STEPS[loadingStep].text}
                </div>
              </motion.div>
            );
          })()}`;

const newSkeleton = `          {isLoading && (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full mt-16 max-w-md mx-auto flex flex-col items-center space-y-6 px-4"
            >
              {/* Skeleton Image/Video Box */}
              <div className={clsx(
                "w-full aspect-square sm:aspect-video rounded-3xl overflow-hidden relative shadow-2xl",
                isLight ? "bg-neutral-100 border border-neutral-200" : "bg-white/5 border border-white/10"
              )}>
                {/* Moving Shimmer Effect */}
                <motion.div 
                  className={clsx(
                    "absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent",
                    isLight ? "via-neutral-200/50" : "via-white/10"
                  )}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Centered Spinner */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className={clsx("w-8 h-8 animate-spin", isLight ? "text-neutral-400" : "text-white/20")} />
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full space-y-3 mt-4">
                <div className={clsx(
                  "flex justify-between text-xs font-medium",
                  isLight ? "text-neutral-700" : "text-white/70"
                )}>
                  <span>Progress</span>
                  <span>{LOADING_STEPS[loadingStep].target}%</span>
                </div>
                {/* Outer Track */}
                <div className={clsx(
                  "w-full h-3 rounded-full overflow-hidden relative shadow-inner",
                  isLight ? "bg-neutral-200 border border-neutral-300" : "bg-white/5 border border-white/10"
                )}>
                  {/* Inner Fill */}
                  <motion.div 
                    className={clsx(
                      "absolute top-0 left-0 bottom-0 shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                      isLight ? "bg-neutral-800" : "bg-white"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: \`\${LOADING_STEPS[loadingStep].target}%\` }}
                    transition={{ ease: "easeOut", duration: 0.5 }}
                  />
                </div>
                <div className={clsx(
                  "text-center text-xs font-medium",
                  isLight ? "text-neutral-500" : "text-white/50"
                )}>
                  Processing Link...
                </div>
              </div>
            </motion.div>
          )}`;

const oldBottomModal = `      <AnimatePresence>
        {Object.keys(activeDownloads).length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] flex flex-col gap-4"
          >
            {/* Glassmorphic Container */}
            <div className={clsx(
              "rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border transition-colors",
              isLight ? "bg-white/80 border-neutral-200" : "bg-neutral-900/80 border-white/10"
            )}>
              <div className="flex items-center justify-between border-b pb-2.5 transition-colors border-neutral-200/40 dark:border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider opacity-90">Active Downloads ({Object.keys(activeDownloads).length})</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setActiveDownloads({})}
                  className="text-xs font-semibold hover:underline opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              <div className="flex flex-col gap-3.5 max-h-[250px] overflow-y-auto custom-scrollbar relative z-10 pr-0.5">
                <AnimatePresence initial={false}>
                  {Object.entries(activeDownloads).map(([url, rawDl]) => {
                    const dl = rawDl as { filename: string; progress: number | null; status: "preparing" | "downloading" | "complete" | "failed" };
                    return (
                      <motion.div 
                        key={url}
                        layout
                        initial={{ opacity: 0, height: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, height: "auto", scale: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, scale: 0.9, y: -10 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        className="flex flex-col gap-2 p-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/5 shadow-sm backdrop-blur-md overflow-hidden group"
                      >
                        <div className="flex items-start justify-between text-xs font-semibold gap-2">
                          <span className="truncate max-w-[75%] text-left font-semibold" title={dl.filename}>{dl.filename}</span>
                          <span className={clsx(
                            "font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                            dl.status === "complete" 
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                              : dl.status === "failed" 
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" 
                                : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          )}>
                            {dl.status === "preparing" 
                              ? "Preparing" 
                              : dl.status === "complete" 
                                ? "Saved" 
                                : dl.status === "failed" 
                                  ? "Failed" 
                                  : dl.progress !== null ? \`\${dl.progress}%\` : "Downloading"
                            }
                          </span>
                        </div>
                        
                        {/* Progress bar container */}
                        <div className="w-full h-1.5 rounded-full bg-neutral-200/50 dark:bg-white/10 overflow-hidden relative">
                          {dl.status === "preparing" ? (
                            <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-[shimmer_1.5s_infinite]" />
                          ) : (
                            <motion.div 
                              className={clsx(
                                "absolute top-0 left-0 h-full rounded-full transition-all duration-300",
                                dl.status === "complete" ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : dl.status === "failed" ? "bg-gradient-to-r from-rose-500 to-red-600" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                              )}
                              style={{ width: \`\${dl.progress !== null ? dl.progress : 50}%\` }}
                              layout
                            />
                          )}
                        </div>
                        
                        {/* Action Row */}
                        <div className="flex items-center justify-between text-[10px] opacity-70">
                          <span className="truncate max-w-[80%] text-left">
                            {dl.status === "downloading" 
                              ? "Streaming content via server..." 
                              : dl.status === "preparing" 
                                ? "Resolving secure video URL..." 
                                : dl.status === "complete" 
                                  ? "Saved successfully to your device!" 
                                  : "An error occurred during extraction"
                            }
                          </span>
                          {dl.status !== "complete" && dl.status !== "failed" && (
                            <button 
                              type="button" 
                              onClick={() => {
                                setActiveDownloads(prev => {
                                  const next = { ...prev };
                                  delete next[url];
                                  return next;
                                });
                              }}
                              className="hover:text-rose-500 hover:underline cursor-pointer font-medium"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

const newBottomModal = `      <AnimatePresence>
        {Object.keys(activeDownloads).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} // Slide up from bottom
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={clsx(
              "fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md border rounded-2xl p-4 shadow-2xl z-50 flex flex-col space-y-4",
              isLight ? "bg-white border-neutral-200" : "bg-[#1a1a1a] border-white/10"
            )}
          >
            {Object.entries(activeDownloads).map(([url, rawDl]) => {
              const dl = rawDl as { filename: string; progress: number | null; status: "preparing" | "downloading" | "complete" | "failed" };
              return (
                <div key={url} className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className={clsx(
                      "text-sm font-medium flex items-center space-x-2 truncate max-w-[70%]",
                      isLight ? "text-neutral-900" : "text-white"
                    )}>
                      {dl.status === "preparing" || dl.status === "downloading" ? (
                        <Loader2 className={clsx("w-4 h-4 animate-spin", isLight ? "text-neutral-500" : "text-white/70")} />
                      ) : dl.status === "complete" ? (
                        <AnimatedCheckMark className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="truncate" title={dl.filename}>{dl.filename}</span>
                    </span>
                    <span className={clsx(
                      "text-xs font-mono shrink-0",
                      isLight ? "text-neutral-500" : "text-white/50"
                    )}>
                      {dl.status === "preparing"
                        ? 'Fetching...'
                        : dl.status === "complete"
                          ? 'Done'
                          : dl.status === "failed"
                            ? 'Failed'
                            : dl.progress === -1 || dl.progress === null 
                              ? 'Fetching...' 
                              : \`\${dl.progress}%\`}
                    </span>
                  </div>
                  
                  {/* Progress Track */}
                  <div className={clsx(
                    "relative w-full h-2 rounded-full overflow-hidden",
                    isLight ? "bg-neutral-200" : "bg-white/5"
                  )}>
                    {dl.status === "preparing" || (dl.status === "downloading" && (dl.progress === -1 || dl.progress === null)) ? (
                      // Indeterminate Infinite Animation
                      <motion.div 
                        className={clsx(
                          "absolute inset-y-0 left-0 w-1/2 rounded-full",
                          isLight ? "bg-neutral-800/40" : "bg-white/40"
                        )}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    ) : (
                      // Determinate Fill Animation
                      <motion.div 
                        className={clsx(
                          "absolute inset-y-0 left-0 rounded-full transition-colors",
                          dl.status === "complete" 
                            ? "bg-emerald-500"
                            : dl.status === "failed"
                              ? "bg-rose-500"
                              : isLight ? "bg-neutral-800" : "bg-white/80"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: dl.status === "complete" ? "100%" : \`\${dl.progress || 0}%\` }}
                        transition={{ ease: "easeOut" }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            
            <button 
              type="button" 
              onClick={() => setActiveDownloads({})}
              className={clsx(
                "text-xs font-semibold hover:underline w-fit self-end mt-2 transition-opacity opacity-60 hover:opacity-100",
                isLight ? "text-neutral-600" : "text-white"
              )}
            >
              Clear All
            </button>
          </motion.div>
        )}
      </AnimatePresence>`;

// Just in case old string has different formatting, I will use regular expressions to match and replace blocks of code.
// The easiest is just replace between known anchor lines.
const lines = content.split('\n');

const startIndexLoading = lines.findIndex(l => l.includes('{isLoading && (() => {'));
let endIndexLoading = -1;
if (startIndexLoading !== -1) {
    let brackets = 0;
    for (let i = startIndexLoading; i < lines.length; i++) {
        if (lines[i].includes('{')) brackets += (lines[i].match(/\{/g) || []).length;
        if (lines[i].includes('}')) brackets -= (lines[i].match(/\}/g) || []).length;
        if (brackets === 0) {
            endIndexLoading = i;
            break;
        }
    }
}

if (startIndexLoading !== -1 && endIndexLoading !== -1) {
    lines.splice(startIndexLoading, endIndexLoading - startIndexLoading + 1, newSkeleton);
} else {
    console.log("Could not find isLoading block");
}

const startBottomModal = lines.findIndex(l => l.includes('{Object.keys(activeDownloads).length > 0 && ('));
// We want to replace the whole <AnimatePresence> that wraps it.
// Wait, the AnimatePresence is right above the {Object.keys... line.
let startAnimate = -1;
for (let i = startBottomModal; i >= 0; i--) {
   if (lines[i].includes('<AnimatePresence>')) {
      startAnimate = i;
      break;
   }
}
let endAnimate = -1;
if (startAnimate !== -1) {
    let brackets = 0;
    for (let i = startAnimate; i < lines.length; i++) {
        // Just find the corresponding </AnimatePresence> which is on the same level
        if (lines[i].includes('</AnimatePresence>')) {
           endAnimate = i;
           break;
        }
    }
}

if (startAnimate !== -1 && endAnimate !== -1) {
    lines.splice(startAnimate, endAnimate - startAnimate + 1, newBottomModal);
} else {
    console.log("Could not find activeDownloads block");
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log("Patched UI animations");
