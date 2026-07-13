import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = r'case \'reddit\':\s*return \(\s*<svg viewBox="0 0 100 100".*?<\/svg>\s*\);'

replacement = r'''case 'reddit':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rdBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff5700" />
              <stop offset="100%" stopColor="#cc3300" />
            </linearGradient>
            <linearGradient id="rdGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="rdInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </radialGradient>
            <linearGradient id="rd3dGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#rdBaseGrad)" filter="drop-shadow(0 6px 12px rgba(255,87,0,0.35))" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#rdInnerShadow)" />
          <g transform="translate(26, 26) scale(1.6)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))">
            <path d="M 29.5 16 c 0 -2 -1.5 -3.5 -3.5 -3.5 c -0.9 0 -1.6 0.3 -2.2 0.8 c -3 -1.8 -6.9 -3 -11.3 -3.2 l 2 -6.2 l 5.2 1.1 c 0.1 1.5 1.4 2.8 3 2.8 c 1.7 0 3 -1.3 3 -3 c 0 -1.7 -1.3 -3 -3 -3 c -1.4 0 -2.6 1 -2.9 2.3 l -5.8 -1.2 c -0.2 0 -0.4 0.1 -0.5 0.3 l -2.3 7 c -4.5 0.2 -8.5 1.4 -11.5 3.2 c -0.6 -0.5 -1.4 -0.8 -2.2 -0.8 c -2 0 -3.5 1.5 -3.5 3.5 c 0 1.4 0.9 2.6 2.1 3.1 c -0.1 0.5 -0.1 1 -0.1 1.6 c 0 6 8.3 11 18.5 11 s 18.5 -5 18.5 -11 c 0 -0.5 0 -1 -0.1 -1.6 c 1.3 -0.5 2.2 -1.7 2.2 -3.1 z m -25.2 9 c 0 -1.4 1.1 -2.5 2.5 -2.5 s 2.5 1.1 2.5 2.5 s -1.1 2.5 -2.5 2.5 s -2.5 -1.1 -2.5 -2.5 z m 10 4 c -2.2 2.2 -6.2 2.2 -8.4 0 c -0.3 -0.3 -0.3 -0.7 0 -0.9 c 0.3 -0.3 0.7 -0.3 0.9 0 c 1.7 1.7 5 1.7 6.6 0 c 0.3 -0.3 0.7 -0.3 0.9 0 c 0.3 0.2 0.3 0.7 0 0.9 z m 0.8 -4 c 0 -1.4 1.1 -2.5 2.5 -2.5 s 2.5 1.1 2.5 2.5 s -1.1 2.5 -2.5 2.5 s -2.5 -1.1 -2.5 -2.5 z" fill="url(#rd3dGrad)" />
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#rdGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
        </svg>
      );'''

content = re.sub(target, replacement, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Replaced render3DGlassIcon reddit")
