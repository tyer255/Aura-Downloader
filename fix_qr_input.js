import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const qrInputSearch = `<div className={clsx(
                    "flex-1 p-2.5 rounded-xl text-xs font-mono truncate select-all border",
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-600" : "bg-black/40 border-white/5 text-neutral-400"
                  )}>
                    {url}
                  </div>`;

const qrInputReplace = `<textarea 
                    readOnly
                    className={clsx(
                      "flex-1 p-2.5 rounded-xl text-[10px] sm:text-xs font-sans font-medium resize-none h-24 outline-none border overflow-y-auto leading-relaxed whitespace-pre-wrap break-words text-left shadow-inner",
                      isLight ? "bg-neutral-50/70 border-neutral-200 text-neutral-700" : "bg-black/40 border-white/10 text-neutral-300"
                    )}
                    value={getShareText(url, originalUrl)}
                  />`;

code = code.replace(qrInputSearch, qrInputReplace);

const targetDirectSearch = `Target Direct Link:`;
const targetDirectReplace = `Share App Text:`;
code = code.replace(targetDirectSearch, targetDirectReplace);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed QR Input box');
