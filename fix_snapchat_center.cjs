const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Fix 1: render3DGlassIcon
// Old: <g transform="translate(25, 25) scale(2)" filter="url(#snapShadow)">
// New: <g transform="translate(28.77, 24.88) scale(2.2)" filter="url(#snapShadow)">
const oldG3d = '<g transform="translate(25, 25) scale(2)" filter="url(#snapShadow)">';
const newG3d = '<g transform="translate(28.77, 24.88) scale(2.2)" filter="url(#snapShadow)">';

if (appContent.includes(oldG3d)) {
    appContent = appContent.replace(oldG3d, newG3d);
} else {
    console.log("Could not find oldG3d in render3DGlassIcon");
}

// Fix 2: BrandIcon
// We need to wrap the <path d="M12.115 1.637c... " in a <g transform="translate(2.35, 0.58)">
// We'll target the BrandIcon's case 'snapchat': specifically.

// The snapchat BrandIcon looks like this:
//     case 'snapchat':
//       return (
//         <svg viewBox="0 0 24 24" className={className} style={{ overflow: 'visible' }}>
//           <path d="M12.115 1.637..." fill="#ffffff" stroke="#111111" strokeWidth="1.2" strokeLinejoin="round" />
//         </svg>
//       );

const brandIconRegex = /case 'snapchat':\s*return \(\s*<svg viewBox="0 0 24 24" className=\{className\} style=\{\{ overflow: 'visible' \}\}>\s*<path d="M12\.115 1\.637c[^"]+" fill="#ffffff" stroke="#111111" strokeWidth="1\.2" strokeLinejoin="round" \/>\s*<\/svg>\s*\);/m;

const match = appContent.match(brandIconRegex);
if (match) {
    const replacement = match[0].replace(
        /<path d="M12\.115 1\.637c[^"]+" fill="#ffffff" stroke="#111111" strokeWidth="1\.2" strokeLinejoin="round" \/>/,
        '<g transform="translate(2.35, 0.58)">\n            <path d="M12.115 1.637c.214 0 .41.168.41.168.932.784 1.523 2.023 1.523 3.118v.098c0 .252.083.49.243.67.28.309.684.42 1.08.337.62-.14 1.286-.043 1.802.308.25.168.38.42.38.685 0 .448-.312.854-.827 1.092a3.25 3.25 0 0 0-1.892 2.868c-.01 1.176.626 2.14 1.524 2.463.64.223 1.374.152 1.875-.084.818-.392 1.522.476.751.951-.724.434-1.312 1.092-1.674 1.876l-.04.098c-.378 1.05-1.436 1.678-2.533 1.678-.256 0-.51-.027-.758-.098a5.67 5.67 0 0 1-3.782 3.539 1.365 1.365 0 0 1-1.05.027 5.65 5.65 0 0 1-3.892-3.566 3.407 3.407 0 0 1-.758.098c-1.096 0-2.153-.629-2.533-1.678-.014-.028-.028-.07-.042-.112-.352-.756-.922-1.4-1.62-1.818-.758-.462-.066-1.344.758-.952.502.238 1.233.308 1.874.084.896-.322 1.533-1.287 1.523-2.462a3.252 3.252 0 0 0-1.884-2.868c-.514-.238-.824-.643-.824-1.092 0-.265.13-.517.38-.685.517-.349 1.182-.447 1.801-.307.394.084.796-.027 1.077-.336.158-.182.242-.42.242-.671v-.098c0-1.092.59-2.333 1.523-3.12a2.44 2.44 0 0 1 1.036-.489c.496-.084 1.036-.042 1.49.14h.001Z" fill="#ffffff" stroke="#111111" strokeWidth="1.2" strokeLinejoin="round" />\n          </g>'
    );
    appContent = appContent.replace(match[0], replacement);
} else {
    console.log("Could not find BrandIcon regex match");
}

fs.writeFileSync('src/App.tsx', appContent);
console.log("Done");
