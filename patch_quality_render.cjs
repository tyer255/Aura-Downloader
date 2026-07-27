const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                                      const activeDl = activeDownloads[q.url];
                                      const filename = (result.title || "download").slice(0, 30).trim() + "_" + q.label.replace(/\\s+/g, "_") + "." + (q.ext || "mp4");
                                      const isPlaceholder = q.size && String(q.size).match(/^[a-zA-Z\\s]+$/);
                                      const sizeDisplay = fetchedSizes[q.url] && fetchedSizes[q.url] !== "Size Unknown" 
                                          ? fetchedSizes[q.url] 
                                          : (!isPlaceholder && q.size ? q.size : (q.isAudio ? "MP3 Audio" : "Unknown Size"));
                                      return (
                                        <div key={idx} className="flex items-center gap-2 w-full">
                                          <button type="button"
                                            id={idx === 0 ? "tour-regular-download" : undefined}
                                            onClick={(e) => { e.preventDefault(); downloadFileClientSide(q.url, filename); }}
                                            disabled={!!activeDl && activeDl.status !== "complete" && activeDl.status !== "failed"}
                                            className={clsx(
                                              "flex-1 flex items-center justify-between p-3 rounded-xl transition-all border group/quality cursor-pointer disabled:cursor-not-allowed",
                                              isLight
                                                 ? "bg-white hover:bg-[#ff1e42] hover:text-white border-neutral-200"
                                                 : "bg-white/5 hover:bg-[#ff1e42] hover:text-white border-white/10",
                                              activeDl && "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10"
                                            )}
                                          >
                                            <div className="flex flex-col text-left">
                                              <span className={clsx(
                                                "font-bold text-sm transition-colors",
                                                isLight ? "text-neutral-800 group-hover/quality:text-white" : "text-white group-hover/quality:text-white",
                                                activeDl?.status === "complete" && "text-emerald-500",
                                                activeDl?.status === "failed" && "text-rose-500"
                                              )}>
                                                {q.label}
                                              </span>
                                              <span className={clsx(
                                                "text-xs transition-colors",
                                                isLight ? "text-neutral-500 group-hover/quality:text-white/80" : "text-neutral-400 group-hover/quality:text-white/80",
                                                activeDl && "text-emerald-600 dark:text-emerald-400 font-medium"
                                              )}>
                                                {activeDl 
                                                   ? activeDl.status === "preparing" ? (activeDl.progress ? \`Preparing stream (\${activeDl.progress}%)\` : "Preparing stream...") 
                                                    : activeDl.status === "downloading" 
                                                      ? activeDl.progress !== null ? \`Downloading in background (\${activeDl.progress}%)\` : "Downloading stream..."
                                                      : activeDl.status === "complete" 
                                                        ? "Saved successfully!"
                                                        : "Download failed"
                                                   : sizeDisplay}
                                              </span>
                                            </div>
                                            <div className={clsx(
                                              "p-2 rounded-lg transition-colors border",
                                              isLight 
                                                 ? "bg-neutral-100 border-neutral-200 text-neutral-600 group-hover/quality:bg-white/20 group-hover/quality:text-white group-hover/quality:border-transparent" 
                                                 : "bg-white/5 border-white/10 text-neutral-400 group-hover/quality:bg-white/20 group-hover/quality:text-white group-hover/quality:border-transparent",
                                              activeDl?.status === "complete" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            )}>
                                              {activeDl && (activeDl.status === "preparing" || activeDl.status === "downloading") ? (
                                                 <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                              ) : activeDl?.status === "complete" ? (
                                                 <Check className="w-4 h-4" />
                                              ) : activeDl?.status === "failed" ? (
                                                 <X className="w-4 h-4 text-rose-500" />
                                              ) : (
                                                 <Download className="w-4 h-4" />
                                              )}
                                            </div>
                                          </button>`;

const replacement = `                                      const activeDl = activeDownloads[q.url];
                                      const filename = (result.title || "download").slice(0, 30).trim() + "_" + q.label.replace(/\\s+/g, "_") + "." + (q.ext || "mp4");
                                      const isPlaceholder = q.size && String(q.size).match(/^[a-zA-Z\\s]+$/);
                                      const isResolving = (!q.size || isPlaceholder || q.size === 'Unknown Size') && !fetchedSizes[q.url];
                                      const sizeDisplay = fetchedSizes[q.url] && fetchedSizes[q.url] !== "Size Unknown" 
                                          ? fetchedSizes[q.url] 
                                          : (!isPlaceholder && q.size ? q.size : (q.isAudio ? "MP3 Audio" : "Unknown Size"));
                                      return (
                                        <div key={idx} className="flex items-center gap-2 w-full">
                                          <button type="button"
                                            id={idx === 0 ? "tour-regular-download" : undefined}
                                            onClick={(e) => { e.preventDefault(); downloadFileClientSide(q.url, filename); }}
                                            disabled={isResolving || (!!activeDl && activeDl.status !== "complete" && activeDl.status !== "failed")}
                                            className={clsx(
                                              "flex-1 flex items-center justify-between p-3 rounded-xl transition-all border group/quality cursor-pointer disabled:cursor-not-allowed",
                                              isLight
                                                 ? "bg-white hover:bg-[#ff1e42] hover:text-white border-neutral-200"
                                                 : "bg-white/5 hover:bg-[#ff1e42] hover:text-white border-white/10",
                                              activeDl && "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10",
                                              isResolving && "opacity-80 hover:bg-white dark:hover:bg-white/5 hover:text-current animate-pulse"
                                            )}
                                          >
                                            <div className="flex flex-col text-left">
                                              <span className={clsx(
                                                "font-bold text-sm transition-colors",
                                                isLight ? "text-neutral-800 group-hover/quality:text-white" : "text-white group-hover/quality:text-white",
                                                activeDl?.status === "complete" && "text-emerald-500",
                                                activeDl?.status === "failed" && "text-rose-500",
                                                isResolving && "text-neutral-500 dark:text-neutral-400 group-hover/quality:text-neutral-500 dark:group-hover/quality:text-neutral-400"
                                              )}>
                                                {q.label}
                                              </span>
                                              <span className={clsx(
                                                "text-xs transition-colors",
                                                isLight ? "text-neutral-500 group-hover/quality:text-white/80" : "text-neutral-400 group-hover/quality:text-white/80",
                                                activeDl && "text-emerald-600 dark:text-emerald-400 font-medium",
                                                isResolving && "group-hover/quality:text-neutral-400"
                                              )}>
                                                {isResolving 
                                                   ? <span className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500"><Loader2 className="w-3 h-3 animate-spin" /> Retrieving data...</span>
                                                   : activeDl 
                                                   ? activeDl.status === "preparing" ? (activeDl.progress ? \`Preparing stream (\${activeDl.progress}%)\` : "Preparing stream...") 
                                                    : activeDl.status === "downloading" 
                                                      ? activeDl.progress !== null ? \`Downloading in background (\${activeDl.progress}%)\` : "Downloading stream..."
                                                      : activeDl.status === "complete" 
                                                        ? "Saved successfully!"
                                                        : "Download failed"
                                                   : sizeDisplay}
                                              </span>
                                            </div>
                                            <div className={clsx(
                                              "p-2 rounded-lg transition-colors border",
                                              isLight 
                                                 ? "bg-neutral-100 border-neutral-200 text-neutral-600 group-hover/quality:bg-white/20 group-hover/quality:text-white group-hover/quality:border-transparent" 
                                                 : "bg-white/5 border-white/10 text-neutral-400 group-hover/quality:bg-white/20 group-hover/quality:text-white group-hover/quality:border-transparent",
                                              activeDl?.status === "complete" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                              isResolving && "group-hover/quality:bg-neutral-100 dark:group-hover/quality:bg-white/5 group-hover/quality:text-neutral-600 dark:group-hover/quality:text-neutral-400 group-hover/quality:border-neutral-200 dark:group-hover/quality:border-white/10"
                                            )}>
                                              {(activeDl && (activeDl.status === "preparing" || activeDl.status === "downloading")) || isResolving ? (
                                                 <Loader2 className={clsx("w-4 h-4 animate-spin", isResolving ? "text-neutral-400" : "text-emerald-500")} />
                                              ) : activeDl?.status === "complete" ? (
                                                 <Check className="w-4 h-4" />
                                              ) : activeDl?.status === "failed" ? (
                                                 <X className="w-4 h-4 text-rose-500" />
                                              ) : (
                                                 <Download className="w-4 h-4" />
                                              )}
                                            </div>
                                          </button>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated quality button render");
