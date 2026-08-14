const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

const loaderRegex = /\{\s*(?:isLoading\s*\|\|\s*isResolving)\s*\?\s*\(\s*<Loader2 className="[^"]+"\s*\/>\s*\)\s*:\s*isPlaying\s*\?/m;

const newContent = `{isLoading || isResolving ? (
                      <div className="relative flex items-center justify-center w-full h-full z-10">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 p-[2px]" viewBox="0 0 100 100">
                          <circle 
                            cx="50" cy="50" r="46" 
                            fill="transparent" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            className="text-white/10 dark:text-neutral-900/10" 
                          />
                          <circle 
                            cx="50" cy="50" r="46" 
                            fill="transparent" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            strokeDasharray="289.026" 
                            strokeDashoffset={289.026 - (289.026 * ((resolveProgress || 0) / 100))}
                            strokeLinecap="round"
                            className="text-[var(--text-main)] transition-all duration-300 ease-out" 
                          />
                        </svg>
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-main)]">{Math.round(resolveProgress || 0)}%</span>
                      </div>
                    ) : isPlaying ?`;
                    
code = code.replace(loaderRegex, newContent);

// Remove the old resolving status text below the album art
// The code has:
/*
                {/* Processing Status * /}
                <AnimatePresence>
                    {(isResolving || isLoading) && !compact && (
                        ...
                            <h3 className="text-lg font-bold text-[var(--text-main)]">{isResolving ? resolveMessage : "Loading..."}</h3>
                            <p className="text-sm font-medium text-[var(--text-muted)] opacity-80">{isResolving ? `Loading...` : "Loading..."}</p>
*/
// We might just want to hide it or keep it but update it to show the message.
// The user said: "Do NOT put the percentage... Above the player... In a separate loading screen... It MUST be inside the center circular control"
// But keeping the message (like "Extracting audio...") might still be okay, just without the percentage. Wait, there wasn't a percentage there anyway, it was just text. Let's make sure the text is kept clean or hidden. Actually, let's leave the text as is but make sure no percentage is shown there. The user said "During this extraction time, the center control area of the music player is empty/loading... I want the ACTUAL extraction percentage to be shown EXACTLY in the CENTER CIRCLE".

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Patched play-pause button for real percentage and ring");
