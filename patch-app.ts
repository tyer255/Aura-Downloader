import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `{/* Status / Percentage Row */}
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
                </div>

                {/* Status message */}
                <div className={clsx("text-sm font-semibold tracking-wide transition-colors", isLight ? "text-neutral-600" : "text-neutral-400")}>
                  Processing Link...
                </div>`;

const replacement = `{/* Status / Percentage Row */}
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
                </div>`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx extracting bar");
} else {
  console.log("Could not find targetStr in App.tsx");
}
