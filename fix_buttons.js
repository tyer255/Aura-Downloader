import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf8');

// Line 2599
app = app.replace(
    /                  <span className="relative z-10 flex items-center gap-1\.5">\n                    \{tab\.label\}\n                    \{tab\.isNew && <NewBadge \/>\}\n                  <\/span>\n                <\/button>/,
    `                  <span className="relative z-10 flex items-center gap-1.5">\n                    {tab.label}\n                    {tab.isNew && <NewBadge />}\n                  </span>\n                </Link>`
);

// Line 2768
app = app.replace(
    /                        <BrandIcon id=\{tab\.id\} className="w-5 h-5 sm:w-6 sm:h-6" \/>\n                      <\/button>/,
    `                        <BrandIcon id={tab.id} className="w-5 h-5 sm:w-6 sm:h-6" />\n                      </Link>`
);

fs.writeFileSync('src/App.tsx', app);
console.log('Fixed button closing tags');
