import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `              </AnimatePresence>
              )}
              <div className="p-4 border-t border-white/10">`;

const replacement = `              </AnimatePresence>
              )}
              </div>
              <div className="p-4 border-t border-white/10">`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Matched and fixed flex-1 div!");
} else {
    console.log("no match ternary 2");
}
fs.writeFileSync('src/App.tsx', content);
