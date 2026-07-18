const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                  className={clsx(
                    "w-full max-w-2xl p-4.5 rounded-3xl mb-8 border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-medium transition-colors text-left shadow-lg backdrop-blur-sm",
                    isLight 
                      ? "bg-amber-50/90 border-amber-200 text-amber-900" 
                      : "bg-amber-950/20 border-amber-500/20 text-amber-200"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <AlertCircle className="w-5.5 h-5.5 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-base tracking-tight mb-0.5">{validationError.title}</h4>
                      <p className={clsx("text-xs font-medium leading-relaxed", isLight ? "text-neutral-600" : "text-neutral-400")}>
                        {validationError.message}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const prevUrl = url;
                      setActiveTab(validationError.targetTab);
                      setResult(null);
                      setValidationError(null);
                      setUrl(prevUrl);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold transition-all text-xs cursor-pointer shadow-md hover:shadow-lg shadow-amber-500/20 whitespace-nowrap uppercase tracking-wider"
                  >`;

const replacement = `                  className={clsx(
                    "w-full max-w-2xl p-5 rounded-3xl mb-8 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm font-medium transition-colors text-left shadow-lg backdrop-blur-sm",
                    isLight 
                      ? "bg-amber-50/90 border-amber-200 text-amber-900" 
                      : "bg-amber-950/20 border-amber-500/20 text-amber-200"
                  )}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <AlertCircle className="w-5.5 h-5.5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-base tracking-tight mb-0.5 truncate">{validationError.title}</h4>
                      <p className={clsx("text-xs font-medium leading-relaxed break-words", isLight ? "text-neutral-600" : "text-neutral-400")}>
                        {validationError.message}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const prevUrl = url;
                      setActiveTab(validationError.targetTab);
                      setResult(null);
                      setValidationError(null);
                      setUrl(prevUrl);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 shrink-0 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold transition-all text-xs cursor-pointer shadow-md hover:shadow-lg shadow-amber-500/20 whitespace-nowrap uppercase tracking-wider"
                  >`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
