import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        })()}
      <style dangerouslySetInnerHTML={{ __html: \``;

const replacement = `        })()}
      </AnimatePresence>
      <style dangerouslySetInnerHTML={{ __html: \``;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Matched and fixed lightbox!");
} else {
    console.log("no match lightbox");
}
fs.writeFileSync('src/App.tsx', content);
