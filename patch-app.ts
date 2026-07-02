import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                                  <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block">
                                    Available Quality Formats:
                                  </span>
                                  <div className="grid grid-cols-2 gap-2">
                                    {[
                                      { label: "1080p", sub: "Full HD" },
                                      { label: "720p", sub: "Standard HD" },
                                      { label: "480p", sub: "Medium SD" },
                                      { label: "360p", sub: "Low Quality" }
                                    ].map((opt) => (
                                      <a
                                        key={opt.label}
                                        href="#" onClick={(e) => { e.preventDefault(); downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item.mp4"); }}
                                        
                                        className={clsx(
                                          "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all border group/item-quality",
                                          isLight ? "bg-white hover:bg-[#ff1e42] hover:text-white border-neutral-200" : "bg-white/5 hover:bg-[#ff1e42] hover:text-white border-white/5"
                                        )}
                                      >
                                        <span className={clsx(
                                          "font-extrabold text-xs transition-colors",
                                          isLight ? "text-neutral-800 group-hover/item-quality:text-white" : "text-white group-hover/item-quality:text-white"
                                        )}>
                                          {opt.label}
                                        </span>
                                        <span className={clsx(
                                          "text-[8px] transition-colors uppercase tracking-wider",
                                          isLight ? "text-neutral-500 group-hover/item-quality:text-white/80" : "text-neutral-400 group-hover/item-quality:text-white/80"
                                        )}>
                                          {opt.sub}
                                        </span>
                                      </a>
                                    ))}
                                  </div>`;

const replacementStr = `                                  <a
                                    href="#" onClick={(e) => { e.preventDefault(); downloadFileClientSide(item.url, (result.title || "media").slice(0, 30).trim() + "_item.mp4"); }}
                                    className={clsx(
                                      "w-full inline-flex items-center justify-center gap-2 border px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                                      isLight ? "bg-white hover:bg-[#ff1e42] hover:text-white border-neutral-200" : "bg-white/5 hover:bg-[#ff1e42] hover:text-white border-white/10"
                                    )}
                                  >
                                    <Download className="w-4 h-4" /> Download Video
                                  </a>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Patched App.tsx successfully!");
} else {
  console.log("Could not find target string.");
}
