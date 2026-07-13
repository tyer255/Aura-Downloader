import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = r'case \'reddit\':\s*return \{\s*icon: \(\s*<svg viewBox="0 0 24 24".*?<\/svg>\s*\),'
replacement = r'''case 'reddit':
      return {
        icon: (
          <svg viewBox="0 0 40 40" className="w-[22px] h-[22px] drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="reddit-3d" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6314"/>
                <stop offset="100%" stopColor="#CC3D00"/>
              </linearGradient>
              <linearGradient id="reddit-glass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                <stop offset="50%" stopColor="white" stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="10" fill="url(#reddit-3d)" />
            <rect width="40" height="40" rx="10" fill="url(#reddit-glass)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            
            {/* Glossy top highlight */}
            <path d="M 0 10 C 0 4.5 4.5 0 10 0 L 30 0 C 35.5 0 40 4.5 40 10 L 40 15 C 20 15 0 10 0 20 Z" fill="white" fillOpacity="0.1" />

            <g transform="translate(8, 8)">
               <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.23-1.72l1.36-4.3 3.74.8c.04.97.83 1.75 1.8 1.75 1 0 1.8-.8 1.8-1.8s-.8-1.8-1.8-1.8c-.85 0-1.57.59-1.75 1.38l-4.13-.88c-.24-.05-.48.1-.55.34l-1.5 4.76c-2.45.06-4.73.7-6.4 1.73-.55-.73-1.43-1.19-2.42-1.19-1.65 0-3 1.35-3 3 0 1.13.62 2.1 1.54 2.61-.04.26-.06.52-.06.79 0 3.44 4.02 6.22 9 6.22s9-2.78 9-6.22c0-.27-.02-.53-.06-.79.92-.51 1.54-1.48 1.54-2.61zm-18 1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5zm9 3.5c-1.8 1.8-5.2 1.8-7 0-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 1.4 1.4 4.2 1.4 5.6 0 .2-.2.5-.2.7 0 .2.2.2.5 0 .7zm-.5-2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="white" drop-shadow="0px 2px 4px rgba(0,0,0,0.2)"/>
            </g>
          </svg>
        ),'''

content = re.sub(target, replacement, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Replaced reddit logo")
