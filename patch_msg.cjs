const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{result.success ? (
                <div className="space-y-6">
                  
                  {/* PROFILE TEMPLATE */}`;
const replacement = `{result.success ? (
                <div className="space-y-6">
                  {result.message && (
                    <div className={clsx("p-4 rounded-xl border text-sm font-medium shadow-sm flex items-start gap-3", 
                      isLight ? "bg-amber-50 text-amber-900 border-amber-200" : "bg-amber-500/10 text-amber-200 border-amber-500/20"
                    )}>
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>{result.message}</div>
                    </div>
                  )}
                  
                  {/* PROFILE TEMPLATE */}`;
code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
