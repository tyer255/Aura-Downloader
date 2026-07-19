const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                  <input
                    
                    
                    id="tour-input" type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder={activeTabData.placeholder}
                    required
                    aria-label="Social media post or media URL"
                    className={clsx(
                      "w-full bg-transparent text-base sm:text-lg placeholder-neutral-400 outline-none py-3 pr-20 transition-colors",
                      isLight ? "text-neutral-900 placeholder-neutral-400" : "text-white placeholder-neutral-500"
                    )}
                  />
                  <button
                    id="tour-search-button"
                    type="submit"
                    disabled={isLoading || !url}
                    aria-label="Start fetching media"
                    className={clsx(
                      "absolute right-2 top-2 bottom-2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg cursor-pointer",
                      isLight 
                        ? isLoading || !url ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-105 active:scale-95 hover:shadow-xl" 
                        : isLoading || !url ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-white text-black hover:bg-neutral-200 hover:scale-105 active:scale-95 shadow-white/20 hover:shadow-white/30 hover:shadow-xl"
                    )}
                  >`;

const replacement = `                  <input
                    id="tour-input" type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder={activeTabData.placeholder}
                    required
                    aria-label="Social media post or media URL"
                    className={clsx(
                      "w-full bg-transparent text-base sm:text-lg placeholder-neutral-400 outline-none py-3 pr-16 sm:pr-20 transition-colors",
                      isLight ? "text-neutral-900 placeholder-neutral-400" : "text-white placeholder-neutral-500"
                    )}
                  />
                  <button
                    id="tour-search-button"
                    type="submit"
                    disabled={isLoading || !url}
                    aria-label="Start fetching media"
                    className={clsx(
                      "absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg cursor-pointer",
                      isLight 
                        ? isLoading || !url ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-105 active:scale-95 hover:shadow-xl" 
                        : isLoading || !url ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-white text-black hover:bg-neutral-200 hover:scale-105 active:scale-95 shadow-white/20 hover:shadow-white/30 hover:shadow-xl"
                    )}
                  >`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
