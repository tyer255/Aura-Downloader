import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = '''                        {/* Names Details */}
                        <div className="mb-6">
                          <h3 className={clsx("text-2xl sm:text-3xl font-extrabold transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                            {result.profile.displayName || result.profile.username}
                          </h3>
                          <p className="text-red-500 font-mono text-sm mt-1">@{result.profile.username}</p>
                          {result.profile.bio && (
                            <p className={clsx(
                              "text-sm mt-4 leading-relaxed max-w-2xl p-4 rounded-xl border transition-colors",
                              isLight ? "text-neutral-700 bg-neutral-50 border-neutral-200" : "text-neutral-300 bg-white/5 border-white/5"
                            )}>
                              {result.profile.bio}
                            </p>
                          )}
                        </div>'''

replacement = '''                        {/* Names Details */}
                        <div className="mb-6">
                          <h3 className={clsx("text-2xl sm:text-3xl font-extrabold transition-colors", isLight ? "text-neutral-900" : "text-white")}>
                            {result.profile.displayName || result.profile.username}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                              <p className="text-red-500 font-mono text-sm">@{result.profile.username.replace('@', '')}</p>
                              {!result.profile.avatarUrl && (
                                 <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                   Proxy Blocked
                                 </span>
                              )}
                          </div>
                          {!result.profile.avatarUrl && (
                             <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400 flex items-start gap-3 max-w-2xl">
                               <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                               <p><strong>Anti-Bot Protection Active:</strong> The host server IP (e.g., Render) was blocked by this platform while fetching profile metadata. Using generic placeholder instead.</p>
                             </div>
                          )}
                          {result.profile.bio && (
                            <p className={clsx(
                              "text-sm mt-4 leading-relaxed max-w-2xl p-4 rounded-xl border transition-colors",
                              isLight ? "text-neutral-700 bg-neutral-50 border-neutral-200" : "text-neutral-300 bg-white/5 border-white/5"
                            )}>
                              {result.profile.bio}
                            </p>
                          )}
                        </div>'''

if target in content:
    content = content.replace(target, replacement)
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Replaced Names Details successfully")
else:
    print("Target Names Details not found")
