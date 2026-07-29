import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetContent = `              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setResult(null);
                    setValidationError(null);
                    // Retain the URL if it happens to match the newly selected tab, or clear it if it doesn't
                    const detected = detectPlatformFromUrl(url);
                    if (detected !== tab.id) {
                      setUrl('');
                    } else {
                      setValidationError(null);
                    }
                  }}
                  className={clsx(
                    "px-6 py-3 rounded-xl text-base font-semibold transition-all whitespace-nowrap cursor-pointer relative select-none",
                    isActive 
                      ? isLight 
                        ? "text-white" 
                        : "text-black"
                      : isLight
                        ? "text-neutral-600 hover:text-neutral-950"
                        : "text-neutral-400 hover:text-white"
                  )}
                >
                  {isActive && (`;

const replacementContent = `              return (
                <Link
                  key={tab.id}
                  to={tab.id === 'pinterest' ? '/' : \`/\${tab.id}-downloader\`}
                  ref={(el: any) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setResult(null);
                    setValidationError(null);
                    // Retain the URL if it happens to match the newly selected tab, or clear it if it doesn't
                    const detected = detectPlatformFromUrl(url);
                    if (detected !== tab.id) {
                      setUrl('');
                    } else {
                      setValidationError(null);
                    }
                  }}
                  className={clsx(
                    "px-6 py-3 rounded-xl text-base font-semibold transition-all whitespace-nowrap cursor-pointer relative select-none",
                    isActive 
                      ? isLight 
                        ? "text-white" 
                        : "text-black"
                      : isLight
                        ? "text-neutral-600 hover:text-neutral-950"
                        : "text-neutral-400 hover:text-white"
                  )}
                >
                  {isActive && (`;

app = app.replace(targetContent, replacementContent);
// Close tag replacement for the main tabs
app = app.replace(
    /                  \} \/>\n                <\/button>\n              \);\n            \}\)}/g,
    `                  } />\n                </Link>\n              );\n            })}`
);

fs.writeFileSync('src/App.tsx', app);
console.log('Fixed tab links');
