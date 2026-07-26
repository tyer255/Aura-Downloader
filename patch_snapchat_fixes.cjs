const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add snapchat to BrandIcon
const brandIconLinkedin = `    case 'linkedin':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;`;

const brandIconSnapchat = `    case 'snapchat':
      return <svg fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12.115 1.637c.214 0 .41.168.41.168.932.784 1.523 2.023 1.523 3.118v.098c0 .252.083.49.243.67.28.309.684.42 1.08.337.62-.14 1.286-.043 1.802.308.25.168.38.42.38.685 0 .448-.312.854-.827 1.092a3.25 3.25 0 0 0-1.892 2.868c-.01 1.176.626 2.14 1.524 2.463.64.223 1.374.152 1.875-.084.818-.392 1.522.476.751.951-.724.434-1.312 1.092-1.674 1.876l-.04.098c-.378 1.05-1.436 1.678-2.533 1.678-.256 0-.51-.027-.758-.098a5.67 5.67 0 0 1-3.782 3.539 1.365 1.365 0 0 1-1.05.027 5.65 5.65 0 0 1-3.892-3.566 3.407 3.407 0 0 1-.758.098c-1.096 0-2.153-.629-2.533-1.678-.014-.028-.028-.07-.042-.112-.352-.756-.922-1.4-1.62-1.818-.758-.462-.066-1.344.758-.952.502.238 1.233.308 1.874.084.896-.322 1.533-1.287 1.523-2.462a3.252 3.252 0 0 0-1.884-2.868c-.514-.238-.824-.643-.824-1.092 0-.265.13-.517.38-.685.517-.349 1.182-.447 1.801-.307.394.084.796-.027 1.077-.336.158-.182.242-.42.242-.671v-.098c0-1.092.59-2.333 1.523-3.12a2.44 2.44 0 0 1 1.036-.489c.496-.084 1.036-.042 1.49.14h.001Z" /></svg>;`;

if (appContent.includes(brandIconLinkedin)) {
  appContent = appContent.replace(brandIconLinkedin, brandIconLinkedin + '\n' + brandIconSnapchat);
}

// 2. Fix the dark mode background in DownloaderView
const oldDarkBg = `case 'snapchat': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#EAB308_0%,#A16207_70%,#000000_100%)]';`;
const newDarkBg = `case 'snapchat': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#423D10_0%,#242104_70%,#000000_100%)]';`;
if (appContent.includes(oldDarkBg)) {
  appContent = appContent.replace(oldDarkBg, newDarkBg);
}

// 3. Fix the color logic for "Platform Quick Switch"
const oldStyle = `style={{
                        backgroundColor: isActive ? brandColor : (isLight ? '#ffffff' : 'rgba(255,255,255,0.05)'),
                        color: isActive ? (tab.id === 'tiktok' || tab.id === 'x' ? (isLight ? '#fff' : '#000') : '#fff') : brandColor,
                        borderColor: isActive ? brandColor : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                        ...(isActive ? { "--tw-ring-color": brandColor } as React.CSSProperties : {})
                      }}`;

const newStyle = `style={{
                        backgroundColor: isActive ? brandColor : (isLight ? '#ffffff' : 'rgba(255,255,255,0.05)'),
                        color: isActive ? (tab.id === 'snapchat' ? '#000' : (tab.id === 'tiktok' || tab.id === 'x' ? (isLight ? '#fff' : '#000') : '#fff')) : brandColor,
                        borderColor: isActive ? brandColor : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                        ...(isActive ? { "--tw-ring-color": brandColor } as React.CSSProperties : {})
                      }}`;

if (appContent.includes(oldStyle)) {
  appContent = appContent.replace(oldStyle, newStyle);
}

fs.writeFileSync('src/App.tsx', appContent);
console.log("Patched Snapchat fixes.");
