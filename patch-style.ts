import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        })()}
        }
        .no-scrollbar {`;

const replacement = `        })()}
      <style dangerouslySetInnerHTML={{ __html: \`
        .no-scrollbar {`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Matched and fixed style!");
} else {
    console.log("no match style");
}
fs.writeFileSync('src/App.tsx', content);
