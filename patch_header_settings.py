import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target_header = r'(          \{\/\* Settings Button \*\/\}.*?<Settings className="w-5 h-5" \/>\s*<\/button>)\s*\{\/\* Theme Toggle Button \*\/\}.*?<\/button>\s*<\/div>\s*<\/div>\s*\{\/\* Settings Drawer \*\/\}'
replacement_header = r'''\1
        </div>
      </div>

      {/* Settings Drawer */}'''

content = re.sub(target_header, replacement_header, content, flags=re.DOTALL)

target_settings = r'(                  <\/div>\s*<\/div>\s*<\/div>\s*<\/motion\.div>\s*<\/div>\s*\)\}\s*<\/AnimatePresence>)'
replacement_settings = r'''                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-200/30 dark:border-white/10">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Sun className="w-5 h-5" /> Appearance & Theme</h3>
                  <div className={clsx("flex items-center justify-between p-4 rounded-xl border transition-all", isLight ? "bg-white/40 border-neutral-200/50" : "bg-black/40 border-white/10")}>
                    <div>
                      <div className="font-medium">Dark Mode</div>
                      <div className="text-sm opacity-70">Switch between light and dark themes</div>
                    </div>
                    <button
                      onClick={() => setIsLight(!isLight)}
                      className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        !isLight ? "bg-blue-500" : "bg-neutral-300"
                      )}
                    >
                      <div className={clsx(
                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                        !isLight && "transform translate-x-6"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-200/30 dark:border-white/10">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><History className="w-5 h-5" /> Activity</h3>
                  <div className={clsx("flex items-center justify-between p-4 rounded-xl border transition-all", isLight ? "bg-white/40 border-neutral-200/50" : "bg-black/40 border-white/10")}>
                    <div>
                      <div className="font-medium">Download History</div>
                      <div className="text-sm opacity-70">View your recently downloaded files</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        setTimeout(() => setShowHistory(true), 300);
                      }}
                      className={clsx(
                        "px-4 py-2 rounded-lg font-medium transition-colors text-sm",
                        isLight ? "bg-neutral-900 text-white hover:bg-neutral-800" : "bg-white text-black hover:bg-neutral-200"
                      )}
                    >
                      View History
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>'''

content = re.sub(target_settings, replacement_settings, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Applied header and settings changes")
