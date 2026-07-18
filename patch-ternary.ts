import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\)\}\s+<\/AnimatePresence>\s+<div className="p-4 border-t border-white\/10">/;

if (regex.test(content)) {
    content = content.replace(regex, `)}
              </AnimatePresence>
              )}
              <div className="p-4 border-t border-white/10">`);
    console.log("Matched and replaced ternary!");
} else {
    console.log("no match ternary");
}
fs.writeFileSync('src/App.tsx', content);
