const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

appContent = appContent.replace(
  `    case 'linkedin':
    case 'snapchat':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="liBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">`,
  `    case 'snapchat':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="snap3dBase" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF200" />
              <stop offset="100%" stopColor="#E5C700" />
            </linearGradient>
            <linearGradient id="snap3dGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="snap3dGhost" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f0f0f0" />
            </linearGradient>
            <radialGradient id="snap3dInner" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#snap3dBase)" filter="drop-shadow(0 6px 12px rgba(229,199,0,0.4))" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#snap3dInner)" />
          <g transform="translate(25, 25) scale(2)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))">
            <path d="M11.954 1.636c.205 0 .399.162.399.162.91.757 1.488 1.955 1.488 3.01v.095c0 .243.082.473.238.648.272.298.665.405 1.05.324.604-.135 1.254-.041 1.76.297.243.162.37.405.37.662 0 .432-.303.824-.805 1.054a3.174 3.174 0 0 0-1.84 2.768c-.01 1.134.61 2.066 1.487 2.376.626.216 1.341.148 1.832-.081.798-.378 1.485.459.733.918-.707.419-1.282 1.054-1.636 1.81l-.039.095c-.37 1.013-1.403 1.62-2.474 1.62-.25 0-.498-.027-.741-.095a5.538 5.538 0 0 1-3.693 3.416 1.334 1.334 0 0 1-1.026.027 5.518 5.518 0 0 1-3.8-3.443 3.327 3.327 0 0 1-.741.095c-1.07 0-2.103-.607-2.473-1.62-.014-.027-.028-.067-.042-.108-.344-.73-.902-1.35-1.584-1.755-.742-.446-.065-1.297.742-.919.49.23 1.205.297 1.831.081.876-.31 1.497-1.242 1.487-2.376a3.176 3.176 0 0 0-1.84-2.768c-.502-.23-.805-.621-.805-1.054 0-.256.126-.5.37-.662.505-.337 1.155-.432 1.76-.297.384.081.777-.026 1.05-.324.155-.175.237-.405.237-.648v-.094c0-1.054.577-2.253 1.487-3.013a2.384 2.384 0 0 1 1.012-.472c.485-.082 1.012-.041 1.455.135h.001Z" fill="url(#snap3dGhost)"/>
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#snap3dGlass)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="liBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">`
);

fs.writeFileSync('src/App.tsx', appContent);
console.log("Patched 3D Icon for Snapchat");
