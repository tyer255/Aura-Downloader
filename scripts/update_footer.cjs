const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldFooterLinks = `<div className="text-center">
          <p className={clsx(
            "text-sm font-medium transition-colors",
            isLight ? "text-neutral-500" : "text-neutral-500"
          )}>
            all right reserved by @Mridul-Downloader-app made by = Mridul ❤️
          </p>
        </div>`;

const newFooterLinks = `<div className="text-center flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <Link to="/about" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>About</Link>
            <Link to="/contact" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Contact</Link>
            <Link to="/faq" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>FAQ</Link>
            <Link to="/privacy-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Privacy Policy</Link>
            <Link to="/terms" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Terms & Conditions</Link>
            <Link to="/dmca" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>DMCA</Link>
          </div>
          <p className={clsx(
            "text-sm font-medium transition-colors",
            isLight ? "text-neutral-500" : "text-neutral-500"
          )}>
            all right reserved by @Mridul-Downloader-app made by = Mridul ❤️
          </p>
        </div>`;

content = content.replace(oldFooterLinks, newFooterLinks);

fs.writeFileSync('src/App.tsx', content);
