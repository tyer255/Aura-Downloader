const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove twitter auth token state and usage
content = content.replace("  const [twitterAuthToken, setTwitterAuthToken] = useState(localStorage.getItem('twitterAuthToken') || '');\n", "");
content = content.replace("body: JSON.stringify({ url: url.trim(), twitterAuthToken })", "body: JSON.stringify({ url: url.trim() })");

// 2. Remove twitter auth token input
const twitterInputBlock = `{activeTab === 'x' && (
              <div className="flex flex-col items-center w-full mb-4">
                    <input
                      type="text"
                      value={twitterAuthToken}
                      onChange={(e) => {
                        setTwitterAuthToken(e.target.value);
                        localStorage.setItem("twitterAuthToken", e.target.value);
                      }}
                      placeholder="Optional: Enter Twitter auth_token cookie"
                      className={clsx(
                        "w-full max-w-md px-4 py-2 rounded-full text-xs transition-all outline-none border",
                        isLight ? "bg-white/50 border-neutral-200 text-neutral-800 placeholder-neutral-500" : "bg-black/20 border-white/10 text-white placeholder-neutral-400"
                      )}
                    />
                  </div>
                )}`;
content = content.replace(twitterInputBlock, "");

// 3. Patch background logic
const effectTarget = `  // Save theme selection
  React.useEffect(() => {
    try {
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      if (isLight) {
        document.documentElement.classList.remove('dark');
        document.body.style.background = '';
        document.body.style.backgroundColor = '#fafaf9';
      } else {
        document.documentElement.classList.add('dark');
        document.body.style.background = '';
        document.body.style.backgroundColor = '#0c0a09';
      }
    } catch (e) {}
  }, [isLight]);`;

const effectReplacement = `  // Save theme selection
  React.useEffect(() => {
    try {
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      if (isLight) {
        document.documentElement.classList.remove('dark');
        document.body.style.background = '';
        document.body.style.backgroundColor = '#fafaf9';
      } else {
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#1a1a1a';
        let topColor = '#1a1a1a';
        switch (activeTab) {
          case 'pinterest': topColor = '#5a3e43'; break;
          case 'youtube': topColor = '#5c3a3a'; break;
          case 'instagram': topColor = '#5c4b69'; break;
          case 'tiktok': topColor = '#3f565b'; break;
          case 'facebook': topColor = '#465369'; break;
          case 'reddit': topColor = '#634942'; break;
          case 'x': topColor = '#535658'; break;
          case 'linkedin': topColor = '#4a5056'; break;
          default: topColor = '#2a2a2a'; break;
        }
        document.body.style.background = \`linear-gradient(180deg, \${topColor} 0%, #1a1a1a 80%)\`;
      }
    } catch (e) {}
  }, [isLight, activeTab]);`;

if (content.includes(effectTarget)) {
  content = content.replace(effectTarget, effectReplacement);
  console.log("Background effect patched successfully");
} else {
  console.log("Background effect not found");
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
