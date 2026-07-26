const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                        {(result.qualities && result.qualities.length > 0) ? (() => {
                          const sanitized = sanitizeQualities(result.qualities, result.url);
                          if (sanitized.length > 0) {
                            const videoOptions = sanitized.filter(q => !q.isAudio);
                            const sectionHeader = videoOptions.length > 1 ? "Available Video Quality Formats:" : "Download Media File:";
                            return (`;

const replacement = `                        {(result.qualities && result.qualities.length > 0) ? (() => {
                          const sanitized = sanitizeQualities(result.qualities, result.url);
                          
                          const isResolvingSizes = sanitized.some(q => !q.size && !fetchedSizes[q.url]);
                          
                          if (isResolvingSizes) {
                            return (
                              <div className={clsx("flex flex-col gap-3 w-full border-t pt-8 mt-1 items-center justify-center min-h-[200px] transition-colors", isLight ? "border-neutral-200" : "border-white/10")}>
                                 <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-2" />
                                 <p className="text-sm font-bold tracking-wide uppercase text-emerald-600 dark:text-emerald-400">Analyzing streams</p>
                                 <p className="text-xs text-neutral-500 dark:text-neutral-400">Fetching exact file sizes and qualities...</p>
                              </div>
                            );
                          }

                          if (sanitized.length > 0) {
                            const videoOptions = sanitized.filter(q => !q.isAudio);
                            const sectionHeader = videoOptions.length > 1 ? "Available Video Quality Formats:" : "Download Media File:";
                            return (`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated UI for resolving sizes");
