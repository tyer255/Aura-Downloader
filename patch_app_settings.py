import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add Settings icon to lucide-react import
if "Settings" not in content and "lucide-react" in content:
    content = content.replace("HelpCircle } from 'lucide-react'", "HelpCircle, Settings, DownloadCloud } from 'lucide-react'")

# 2. Add state to DownloaderView
# find `const [isHistorySpinning, setIsHistorySpinning] = useState(false);` or similar to insert near
insert_state = """  const [showSettings, setShowSettings] = useState(false);
  const [throttleSetting, setThrottleSetting] = useState<string>(localStorage.getItem('downloadThrottle') || 'unlimited');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('downloadThrottle', throttleSetting);
  }, [throttleSetting]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };
"""

if "const [showSettings, setShowSettings]" not in content:
    # Let's find a good spot in DownloaderView
    target_state = "const [isHistorySpinning, setIsHistorySpinning] = useState(false);"
    content = content.replace(target_state, insert_state + "\n  " + target_state)

# 3. Add Settings button to header
header_target = """        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Theme Toggle Button */}
          <button"""

header_replacement = """        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Settings Button */}
          <button 
            onClick={() => setShowSettings(true)}
            className={clsx(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-md cursor-pointer",
              isLight 
                ? "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100" 
                : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Theme Toggle Button */}
          <button"""
content = content.replace(header_target, header_replacement)

# 4. Modify download setup to pass throttle
dl_setup_target = """const fetchUrl = url.startsWith("/api/proxy-download") || url.startsWith("/api/youtube-stream") 
        ? url + `&filename=${encodeURIComponent(filename)}`
        : `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;"""

dl_setup_target_alt = """const fetchUrl = url.startsWith("/api/proxy-download") || url.startsWith("/api/youtube-stream") 
        ? url 
        : `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;"""

# Wait, let's just append &throttle= to fetchUrl
append_throttle_code = """
      const throttleParam = throttleSetting !== 'unlimited' ? `&throttle=${throttleSetting}` : '';
      const finalFetchUrl = fetchUrl.includes('?') ? `${fetchUrl}${throttleParam}` : `${fetchUrl}?${throttleParam}`;
"""
# I'll just use regex to inject this before the fetch/document.createElement

content = re.sub(
    r'(const fetchUrl = [^;]+;)', 
    r'\1\n      const throttleParam = throttleSetting !== "unlimited" ? `&throttle=${throttleSetting}` : "";\n      const finalFetchUrl = fetchUrl.includes("?") ? `${fetchUrl}${throttleParam}` : `${fetchUrl}?${throttleParam}`;', 
    content
)
# Now replace fetch(fetchUrl) or a.href = fetchUrl with finalFetchUrl
content = content.replace("fetch(fetchUrl", "fetch(finalFetchUrl")
content = content.replace("a.href = fetchUrl", "a.href = finalFetchUrl")

# 5. Add Settings Drawer inside the <LazyMotion> before or after history drawer
history_drawer_target = "{/* Glassmorphic Sliding History Drawer */}"
settings_drawer = """
      {/* Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-pointer"
            />
              
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={clsx(
                "fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 flex flex-col transition-colors duration-700 shadow-2xl",
                isLight ? "bg-white text-neutral-900 border-l border-neutral-200" : "bg-[#0c0a09] text-white border-l border-white/10"
              )}
            >
              {/* Header */}
              <div className="px-8 py-7 flex justify-between items-center shrink-0 relative border-b border-neutral-200 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <div className={clsx("p-2.5 rounded-xl border shadow-inner", isLight ? "bg-neutral-50 border-neutral-200" : "bg-white/[0.03] border-white/5")}>
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
                    <p className="text-xs opacity-60 mt-0.5">App preferences</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2.5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><DownloadCloud className="w-5 h-5" /> Download Speed</h3>
                  <p className="text-sm opacity-70">Throttle your download speed if you are on a limited or unstable connection to prevent timeouts.</p>
                  
                  <div className="flex flex-col gap-2 mt-4">
                    {[
                      { value: 'unlimited', label: 'Unlimited (Default)' },
                      { value: '5', label: '5 MB/s (Fast)' },
                      { value: '2', label: '2 MB/s (Moderate)' },
                      { value: '1', label: '1 MB/s (Slow/Stable)' },
                    ].map(option => (
                      <label key={option.value} className={clsx(
                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                        throttleSetting === option.value 
                          ? (isLight ? "border-blue-500 bg-blue-50/50 text-blue-700" : "border-blue-500 bg-blue-500/10 text-blue-400")
                          : (isLight ? "border-neutral-200 hover:border-neutral-300" : "border-white/10 hover:border-white/20")
                      )}>
                        <span className="font-medium">{option.label}</span>
                        <input 
                          type="radio" 
                          name="throttle" 
                          value={option.value} 
                          checked={throttleSetting === option.value}
                          onChange={(e) => setThrottleSetting(e.target.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

"""
content = content.replace(history_drawer_target, settings_drawer + "\n" + history_drawer_target)

# 6. Add Install PWA floating button
install_button = """
      <AnimatePresence>
        {deferredPrompt && (
          <motion.button
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            onClick={handleInstallClick}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-full font-semibold shadow-[0_8px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 hover:-translate-x-1/2 transition-all active:scale-95 border border-white/20"
          >
            <DownloadCloud className="w-5 h-5" />
            Install App
          </motion.button>
        )}
      </AnimatePresence>
"""
footer_target = "{/* Main Footer */}"
content = content.replace(footer_target, install_button + "\n      " + footer_target)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Patched App.tsx for Settings and PWA")

