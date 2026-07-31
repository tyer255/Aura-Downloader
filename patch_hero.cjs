const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const oldHero = `            {/* Hero Area */}
            <h1 className={clsx(
              "text-4xl sm:text-5xl leading-[1.1] font-bold mb-6 transition-colors",
              isLight ? "text-neutral-900" : "text-white"
            )}>
              Free <span className="text-primary">{activeTabData.name}</span>
            </h1>`;

const newHero = `            {/* Hero Area */}
            <h1 className={clsx(
              "text-4xl sm:text-5xl leading-[1.1] font-black mb-2 transition-colors",
              isLight ? "text-neutral-900" : "text-white"
            )}>
              Aura <span className="text-primary">Downloader</span>
            </h1>
            <p className={clsx("text-lg sm:text-xl font-bold mb-6 transition-colors", isLight ? "text-neutral-600" : "text-neutral-300")}>
               Free <span className={isLight ? "text-neutral-900" : "text-white"}>{activeTabData.name}</span>
            </p>`;

if (appCode.includes(oldHero)) {
    appCode = appCode.replace(oldHero, newHero);
    fs.writeFileSync('src/App.tsx', appCode);
    console.log("Hero patched successfully!");
} else {
    console.log("Could not find hero area.");
}
