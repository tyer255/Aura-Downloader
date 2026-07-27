const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                          const isResolvingSizes = sanitized.some(q => {
                            const isPlaceholder = q.size && String(q.size).match(/^[a-zA-Z\\s]+$/);
                            return (!q.size || isPlaceholder || q.size === 'Unknown Size') && !fetchedSizes[q.url];
                          });
                          
                          if (isResolvingSizes) {
                            return (
                              <div className={clsx("flex flex-col gap-3 w-full border-t pt-8 mt-1 items-center justify-center min-h-[200px] transition-colors", isLight ? "border-neutral-200" : "border-white/10")}>
                                 <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-2" />
                                 <p className="text-sm font-bold tracking-wide text-emerald-600 dark:text-emerald-400">Preparing download options...</p>
                              </div>
                            );
                          }`;

code = code.replace(target, '');
fs.writeFileSync('src/App.tsx', code);
console.log("Removed isResolvingSizes block");
