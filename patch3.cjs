const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                  <button
                    id="tour-search-button"
                    type="submit"
                    disabled={isLoading || !url}
                    aria-label="Start fetching media"
                    className={clsx(
                      "absolute right-2 top-2 bottom-2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg cursor-pointer",
                      isLight 
                        ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:opacity-70" 
                        : "bg-[#cccccc] text-neutral-800 hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-400 disabled:opacity-70"
                    )}
                  >`;

const replacement = `                  <button
                    id="tour-search-button"
                    type="submit"
                    disabled={isLoading || !url}
                    aria-label="Start fetching media"
                    className={clsx(
                      "absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg cursor-pointer",
                      isLight 
                        ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:opacity-70" 
                        : "bg-[#cccccc] text-neutral-800 hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-400 disabled:opacity-70"
                    )}
                  >`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
