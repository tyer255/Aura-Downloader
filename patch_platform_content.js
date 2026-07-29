import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes("import { PlatformContent } from './components/PlatformContent'")) {
    app = "import { PlatformContent } from './components/PlatformContent';\n" + app;
}

const targetSection = `        {/* Tab-switching Dynamic Content Wrapper */}
        <div className="w-full relative min-h-[400px]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const content = getPlatformContent(tab.id);`;

// Wait, the new PlatformContent is static long-form content, maybe it goes after the download result/platforms list.
// Where is "Supported Platforms"?
