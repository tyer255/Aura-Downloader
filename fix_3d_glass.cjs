const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const spotifyStart = "    case 'spotify':";
const pinterestStart = "    case 'pinterest':";

const startIndex = code.indexOf(spotifyStart, code.indexOf("render3DGlassIcon"));
const endIndex = code.indexOf(pinterestStart, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `    case 'spotify':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="spBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#222222" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <linearGradient id="spGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="spInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
            </radialGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#spBaseGrad)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.35))" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#spInnerShadow)" />
          <g transform="translate(26, 26) scale(2)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
             <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.239.54-.959.72-1.559.3z" fill="#1ED760" />
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#spGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.3" />
        </svg>
      );
    case 'threads':
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="thBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#222222" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <linearGradient id="thGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
            <radialGradient id="thInnerShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
            </radialGradient>
          </defs>
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#thBaseGrad)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.35))" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <rect x="14" y="14" width="72" height="72" rx="22" fill="url(#thInnerShadow)" />
          <g transform="translate(26, 26) scale(2)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
             <path d="M16.7 10.999a4.808 4.808 0 1 0-1.332 3.197h.047a5.578 5.578 0 0 1-5.074 3.49C6.96 17.686 4 14.821 4 11.954c0-2.88 2.924-5.753 6.34-5.753 3.486 0 5.679 2.228 5.679 5.378v.528h-7.14a2.913 2.913 0 0 0 2.85 2.507 2.973 2.973 0 0 0 2.457-1.445l1.636 1.027a4.908 4.908 0 0 1-4.093 2.378 4.887 4.887 0 0 1-4.832-4.969 4.872 4.872 0 0 1 4.89-4.912 4.755 4.755 0 0 1 4.825 4.544v1.761c0 1.233-.51 2.296-1.572 2.296-.543 0-1.056-.25-1.32-.782a4.417 4.417 0 0 1-.362-.008zm-7.14-1.425h5.18a2.923 2.923 0 0 0-2.584-2.593 2.898 2.898 0 0 0-2.597 2.593zm1.884 1.705a2.802 2.802 0 0 1 2.529-1.705 2.769 2.769 0 0 1 2.748 2.102h.007a2.298 2.298 0 0 0-.012-.224 2.87 2.87 0 0 0-.256-1.12c-.528.847-1.455 1.34-2.486 1.34-1.636 0-2.73-1.058-2.53-2.393z" fill="#ffffff" />
          </g>
          <path d="M14 42 C14 26.54 26.54 14 42 14 L58 14 C73.46 14 86 26.54 86 42 C62 47 38 47 14 42 Z" fill="url(#thGlassGrad)" />
          <path d="M17 28 C26 17 74 17 83 28" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.3" />
        </svg>
      );
`;
    
    const before = code.substring(0, startIndex);
    const after = code.substring(endIndex);
    
    fs.writeFileSync('src/App.tsx', before + newBlock + after);
    console.log("Patched 3D glass icons successfully");
} else {
    console.log("Could not find blocks");
}
