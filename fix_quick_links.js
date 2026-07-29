import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetQuickSwitch = `                      <button
                        type="button"
                        onClick={() => {
                           setActiveTab(tab.id);
                           setResult(null);
                           setValidationError(null);
                        }}`;

const replacementQuickSwitch = `                      <Link
                        to={tab.id === 'pinterest' ? '/' : \`/\${tab.id}-downloader\`}
                        onClick={() => {
                           setActiveTab(tab.id);
                           setResult(null);
                           setValidationError(null);
                        }}`;

app = app.replace(targetQuickSwitch, replacementQuickSwitch);

// Need to replace </button> with </Link> inside that div
// Search for </button> inside the <div key={tab.id} className="relative">
app = app.replace(
    /                      <\/button>\n                    <\/div>/g,
    `                      </Link>\n                    </div>`
);

fs.writeFileSync('src/App.tsx', app);
console.log('Fixed Quick switch links');
