import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Replace top navigation tab buttons with Link
app = app.replace(
    /onClick=\{\(\) => \{\n\s*setActiveTab\(tab\.id\);\n\s*setResult\(null\);\n\s*setValidationError\(null\);\n\s*\}\}\n\s*className=\{clsx\(\n\s*"flex flex-col items-center min-w-\[5\.5rem\] sm:min-w-\[6rem\] py-2 px-1 relative z-10 transition-colors cursor-pointer",/g,
    `onClick={() => {
                      setResult(null);
                      setValidationError(null);
                    }}
                    to={tab.id === 'pinterest' ? '/' : \`/\${tab.id}-downloader\`}
                    className={clsx(
                      "flex flex-col items-center min-w-[5.5rem] sm:min-w-[6rem] py-2 px-1 relative z-10 transition-colors cursor-pointer",`
);

app = app.replace(
    /<button\n\s*ref=\{\(el\) => \(tabRefs\.current\[tab\.id\] = el\)\}\n\s*type="button"\n\s*onClick=\{/g,
    '<Link\n                    ref={(el: any) => (tabRefs.current[tab.id] = el)}\n                    onClick={'
);

app = app.replace(
    /className=\{clsx\(\n\s*"flex flex-col items-center min-w-\[5\.5rem\]/g,
    `className={clsx(\n                      "flex flex-col items-center min-w-[5.5rem]`
);

// We need to properly replace <button -> <Link and </button> -> </Link> for the main tabs
// Let's do a more robust regex or script logic
