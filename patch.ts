import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  `           )}>AURA Downloader</h1>
        </div>
        </div>
      </div>

      {/* Top Header Controls */}`,
  `           )}>AURA Downloader</h1>
        </div>
        </div>
        <a 
          href="https://aura-download.ai.studio" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-blue-600 text-white text-xs sm:text-sm px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Install
        </a>
      </div>

      {/* Top Header Controls */}`
);
fs.writeFileSync('src/App.tsx', content);
