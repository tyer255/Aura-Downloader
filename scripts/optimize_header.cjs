const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldHeader = `      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-16 relative z-20">
        <div className={clsx(
          "flex items-center rounded-full pl-4 pr-1.5 py-1.5 transition-colors border",
          isLight ? "bg-white border-neutral-200 text-neutral-600" : "bg-white/5 border border-white/10 text-neutral-400"
        )}>
          <span className="text-sm font-medium tracking-wide mr-3 uppercase">Support =</span>
          <a href="https://youtube.com/@mridulgaming-_-official-800?si=qsAdamH6-973hgBe" target="_blank" rel="noopener noreferrer" className="bg-[#ff0000] text-white text-sm px-4 py-1.5 rounded-full font-semibold flex items-center gap-1.5 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
             <Youtube className="w-4 h-4" /> Subscribe
          </a>
        </div>
        <div className="flex items-center gap-2">`;

const newHeader = `      {/* Top Header */}
      <div className="w-full max-w-2xl flex flex-row items-center justify-between mb-8 sm:mb-16 relative z-20 gap-2 overflow-x-auto no-scrollbar">
        <div className={clsx(
          "flex items-center rounded-full pl-3 sm:pl-4 pr-1 sm:pr-1.5 py-1 sm:py-1.5 transition-colors border shrink-0",
          isLight ? "bg-white border-neutral-200 text-neutral-600" : "bg-white/5 border border-white/10 text-neutral-400"
        )}>
          <span className="text-xs sm:text-sm font-medium tracking-wide mr-2 sm:mr-3 uppercase whitespace-nowrap">Support =</span>
          <a href="https://youtube.com/@mridulgaming-_-official-800?si=qsAdamH6-973hgBe" target="_blank" rel="noopener noreferrer" className="bg-[#ff0000] text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-semibold flex items-center gap-1.5 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 whitespace-nowrap">
             <Youtube className="w-3 h-3 sm:w-4 sm:h-4" /> Subscribe
          </a>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">`;

content = content.replace(oldHeader, newHeader);
fs.writeFileSync('src/App.tsx', content);
