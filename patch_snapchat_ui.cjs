const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix the 3D Glass Icon for Snapchat in Supported Platforms
const oldSnap3DIcon = `    case 'snapchat':
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
            <path d="M12.115 1.637c.214 0 .41.168.41.168.932.784 1.523 2.023 1.523 3.118v.098c0 .252.083.49.243.67.28.309.684.42 1.08.337.62-.14 1.286-.043 1.802.308.25.168.38.42.38.685 0 .448-.312.854-.827 1.092a3.25 3.25 0 0 0-1.892 2.868c-.01 1.176.626 2.14 1.524 2.463.64.223 1.374.152 1.875-.084.818-.392 1.522.476.751.951-.724.434-1.312 1.092-1.674 1.876l-.04.098c-.378 1.05-1.436 1.678-2.533 1.678-.256 0-.51-.027-.758-.098a5.67 5.67 0 0 1-3.782 3.539 1.365 1.365 0 0 1-1.05.027 5.65 5.65 0 0 1-3.892-3.566 3.407 3.407 0 0 1-.758.098c-1.096 0-2.153-.629-2.533-1.678-.014-.028-.028-.07-.042-.112-.352-.756-.922-1.4-1.62-1.818-.758-.462-.066-1.344.758-.952.502.238 1.233.308 1.874.084.896-.322 1.533-1.287 1.523-2.462a3.252 3.252 0 0 0-1.884-2.868c-.514-.238-.824-.643-.824-1.092 0-.265.13-.517.38-.685.517-.349 1.182-.447 1.801-.307.394.084.796-.027 1.077-.336.158-.182.242-.42.242-.671v-.098c0-1.092.59-2.333 1.523-3.12a2.44 2.44 0 0 1 1.036-.489c.496-.084 1.036-.042 1.49.14h.001Z" fill="url(#snap3dGhost)"/>
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#snap3dGlass)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
        </svg>
      );`;

const newSnap3DIcon = `    case 'snapchat':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="snap3dBase" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffc00" />
              <stop offset="100%" stopColor="#e5e200" />
            </linearGradient>
            <linearGradient id="snap3dHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <filter id="snapShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
            </filter>
          </defs>
          <rect x="12" y="12" width="76" height="76" rx="22" fill="url(#snap3dBase)" filter="drop-shadow(0 6px 12px rgba(200,200,0,0.3))" />
          <rect x="12" y="12" width="76" height="76" rx="22" fill="url(#snap3dHighlight)" />
          <g transform="translate(25, 25) scale(2)" filter="url(#snapShadow)">
            <path d="M12.115 1.637c.214 0 .41.168.41.168.932.784 1.523 2.023 1.523 3.118v.098c0 .252.083.49.243.67.28.309.684.42 1.08.337.62-.14 1.286-.043 1.802.308.25.168.38.42.38.685 0 .448-.312.854-.827 1.092a3.25 3.25 0 0 0-1.892 2.868c-.01 1.176.626 2.14 1.524 2.463.64.223 1.374.152 1.875-.084.818-.392 1.522.476.751.951-.724.434-1.312 1.092-1.674 1.876l-.04.098c-.378 1.05-1.436 1.678-2.533 1.678-.256 0-.51-.027-.758-.098a5.67 5.67 0 0 1-3.782 3.539 1.365 1.365 0 0 1-1.05.027 5.65 5.65 0 0 1-3.892-3.566 3.407 3.407 0 0 1-.758.098c-1.096 0-2.153-.629-2.533-1.678-.014-.028-.028-.07-.042-.112-.352-.756-.922-1.4-1.62-1.818-.758-.462-.066-1.344.758-.952.502.238 1.233.308 1.874.084.896-.322 1.533-1.287 1.523-2.462a3.252 3.252 0 0 0-1.884-2.868c-.514-.238-.824-.643-.824-1.092 0-.265.13-.517.38-.685.517-.349 1.182-.447 1.801-.307.394.084.796-.027 1.077-.336.158-.182.242-.42.242-.671v-.098c0-1.092.59-2.333 1.523-3.12a2.44 2.44 0 0 1 1.036-.489c.496-.084 1.036-.042 1.49.14h.001Z" fill="#ffffff" stroke="#111111" strokeWidth="1.2" strokeLinejoin="round" />
          </g>
        </svg>
      );`;

if (appContent.includes(oldSnap3DIcon)) {
  appContent = appContent.replace(oldSnap3DIcon, newSnap3DIcon);
}

// 2. Fix BrandIcon for Snapchat (Quick Switch)
const oldBrandIconSnapchat = `    case 'snapchat':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12.115 1.637c.214 0 .41.168.41.168.932.784 1.523 2.023 1.523 3.118v.098c0 .252.083.49.243.67.28.309.684.42 1.08.337.62-.14 1.286-.043 1.802.308.25.168.38.42.38.685 0 .448-.312.854-.827 1.092a3.25 3.25 0 0 0-1.892 2.868c-.01 1.176.626 2.14 1.524 2.463.64.223 1.374.152 1.875-.084.818-.392 1.522.476.751.951-.724.434-1.312 1.092-1.674 1.876l-.04.098c-.378 1.05-1.436 1.678-2.533 1.678-.256 0-.51-.027-.758-.098a5.67 5.67 0 0 1-3.782 3.539 1.365 1.365 0 0 1-1.05.027 5.65 5.65 0 0 1-3.892-3.566 3.407 3.407 0 0 1-.758.098c-1.096 0-2.153-.629-2.533-1.678-.014-.028-.028-.07-.042-.112-.352-.756-.922-1.4-1.62-1.818-.758-.462-.066-1.344.758-.952.502.238 1.233.308 1.874.084.896-.322 1.533-1.287 1.523-2.462a3.252 3.252 0 0 0-1.884-2.868c-.514-.238-.824-.643-.824-1.092 0-.265.13-.517.38-.685.517-.349 1.182-.447 1.801-.307.394.084.796-.027 1.077-.336.158-.182.242-.42.242-.671v-.098c0-1.092.59-2.333 1.523-3.12a2.44 2.44 0 0 1 1.036-.489c.496-.084 1.036-.042 1.49.14h.001Z" /></svg>;`;

const newBrandIconSnapchat = `    case 'snapchat':
      return (
        <svg viewBox="0 0 24 24" className={className} style={{ overflow: 'visible' }}>
          <path d="M12.115 1.637c.214 0 .41.168.41.168.932.784 1.523 2.023 1.523 3.118v.098c0 .252.083.49.243.67.28.309.684.42 1.08.337.62-.14 1.286-.043 1.802.308.25.168.38.42.38.685 0 .448-.312.854-.827 1.092a3.25 3.25 0 0 0-1.892 2.868c-.01 1.176.626 2.14 1.524 2.463.64.223 1.374.152 1.875-.084.818-.392 1.522.476.751.951-.724.434-1.312 1.092-1.674 1.876l-.04.098c-.378 1.05-1.436 1.678-2.533 1.678-.256 0-.51-.027-.758-.098a5.67 5.67 0 0 1-3.782 3.539 1.365 1.365 0 0 1-1.05.027 5.65 5.65 0 0 1-3.892-3.566 3.407 3.407 0 0 1-.758.098c-1.096 0-2.153-.629-2.533-1.678-.014-.028-.028-.07-.042-.112-.352-.756-.922-1.4-1.62-1.818-.758-.462-.066-1.344.758-.952.502.238 1.233.308 1.874.084.896-.322 1.533-1.287 1.523-2.462a3.252 3.252 0 0 0-1.884-2.868c-.514-.238-.824-.643-.824-1.092 0-.265.13-.517.38-.685.517-.349 1.182-.447 1.801-.307.394.084.796-.027 1.077-.336.158-.182.242-.42.242-.671v-.098c0-1.092.59-2.333 1.523-3.12a2.44 2.44 0 0 1 1.036-.489c.496-.084 1.036-.042 1.49.14h.001Z" fill="#ffffff" stroke="#111111" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );`;

if (appContent.includes(oldBrandIconSnapchat)) {
  appContent = appContent.replace(oldBrandIconSnapchat, newBrandIconSnapchat);
}

// 3. Fix the dark mode background for Snapchat (make it softer/less harsh yellow)
const oldDarkBg = `case 'snapchat': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#423D10_0%,#242104_70%,#000000_100%)]';`;
const newDarkBg = `case 'snapchat': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#2C2A10_0%,#121105_70%,#000000_100%)]';`;
if (appContent.includes(oldDarkBg)) {
  appContent = appContent.replace(oldDarkBg, newDarkBg);
}

// 4. Also fix the other dark bg gradient just in case it wasn't patched correctly earlier
const veryOldDarkBg = `case 'snapchat': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#EAB308_0%,#A16207_70%,#000000_100%)]';`;
if (appContent.includes(veryOldDarkBg)) {
  appContent = appContent.replace(veryOldDarkBg, newDarkBg);
}

fs.writeFileSync('src/App.tsx', appContent);
console.log("Patched Snapchat UI (3D Icon, Quick Switch logo, Dark Mode BG).");
