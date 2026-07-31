const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const lines = appCode.split('\n');
const insertIndex = lines.findIndex(l => l.includes('const activeTabData = TABS.find(t => t.id === activeTab)!;'));

if (insertIndex > -1) {
    lines.splice(insertIndex + 1, 0, `  React.useEffect(() => { document.title = activeTabData.title; }, [activeTabData]);`);
    fs.writeFileSync('src/App.tsx', lines.join('\n'));
    console.log("Title effect patched successfully!");
}
