const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                        <h3 className={clsx("text-xl font-bold mb-6 line-clamp-3 leading-snug transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                          {result.title || "Ready File Asset"}
                        </h3>`;
const replacement = `                        <h3 className={clsx("text-xl font-bold mb-6 line-clamp-3 leading-snug break-words transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                          {result.title || "Ready File Asset"}
                        </h3>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log("Title patched successfully");
} else {
  console.log("Title target not found");
}
