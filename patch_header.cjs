const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the misplaced Admin button
const oldAdminButtonRegex = /<button onClick=\{\(\) => setIsAdminOpen\(true\)\} className="ml-auto flex items-center justify-center p-2 rounded-full bg-neutral-200\/50 hover:bg-neutral-300\/50 dark:bg-white\/5 dark:hover:bg-white\/10 transition-colors">\s*<Settings className="w-5 h-5 opacity-70 hover:opacity-100" \/>\s*<\/button>/;

code = code.replace(oldAdminButtonRegex, '');

// 2. Add it properly grouped with Theme Toggle and History
const newAdminButton = `
          {/* Admin Panel Button */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className={clsx(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-md cursor-pointer",
              isLight 
                ? "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100" 
                : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            )}
            title="Admin Panel"
          >
            <Settings className="w-5 h-5" />
          </button>`;

code = code.replace(/\{(\/\* Theme Toggle Button \*\/)\}/, newAdminButton + '\n          {$1}');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched header layout.");
