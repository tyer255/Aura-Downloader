const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<h3 className={clsx("text-2xl sm:text-3xl font-extrabold transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                            {result.profile.displayName || result.profile.username}
                          </h3>`;
const replacement = `<h3 className={clsx("text-2xl sm:text-3xl font-extrabold transition-colors break-words", isLight ? "text-neutral-900" : "text-white")}>
                            {result.profile.displayName || result.profile.username}
                          </h3>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
