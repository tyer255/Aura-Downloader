const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetBrandIcon = `    case 'snapchat':
      return (
        <svg viewBox="0 0 24 24" className={className} style={{ overflow: 'visible' }}>
          <g transform="translate(2.35, 0.58)">
            <path d="M12.115 1.637c.214 0 .41.168.41.168.932.784 1.523 2.023 1.523 3.118v.098c0 .252.083.49.243.67.28.309.684.42 1.08.337.62-.14 1.286-.043 1.802.308.25.168.38.42.38.685 0 .448-.312.854-.827 1.092a3.25 3.25 0 0 0-1.892 2.868c-.01 1.176.626 2.14 1.524 2.463.64.223 1.374.152 1.875-.084.818-.392 1.522.476.751.951-.724.434-1.312 1.092-1.674 1.876l-.04.098c-.378 1.05-1.436 1.678-2.533 1.678-.256 0-.51-.027-.758-.098a5.67 5.67 0 0 1-3.782 3.539 1.365 1.365 0 0 1-1.05.027 5.65 5.65 0 0 1-3.892-3.566 3.407 3.407 0 0 1-.758.098c-1.096 0-2.153-.629-2.533-1.678-.014-.028-.028-.07-.042-.112-.352-.756-.922-1.4-1.62-1.818-.758-.462-.066-1.344.758-.952.502.238 1.233.308 1.874.084.896-.322 1.533-1.287 1.523-2.462a3.252 3.252 0 0 0-1.884-2.868c-.514-.238-.824-.643-.824-1.092 0-.265.13-.517.38-.685.517-.349 1.182-.447 1.801-.307.394.084.796-.027 1.077-.336.158-.182.242-.42.242-.671v-.098c0-1.092.59-2.333 1.523-3.12a2.44 2.44 0 0 1 1.036-.489c.496-.084 1.036-.042 1.49.14h.001Z" fill="#ffffff" stroke="#111111" strokeWidth="1.2" strokeLinejoin="round" />
          </g>
        </svg>
      );`;
const replaceBrandIcon = targetBrandIcon + `
    case 'spotify':
      return <SpotifyIcon className={className} />;
    case 'threads':
      return <ThreadsIcon className={className} />;`;
code = code.replace(targetBrandIcon, replaceBrandIcon);

const targetBrandColor = `    case 'linkedin': return '#0077b5';
    case 'snapchat': return '#FFFC00';
    default: return isLight ? '#1a1a1a' : '#cccccc';`;
const replaceBrandColor = `    case 'linkedin': return '#0077b5';
    case 'snapchat': return '#FFFC00';
    case 'spotify': return '#1DB954';
    case 'threads': return isLight ? '#000000' : '#FFFFFF';
    default: return isLight ? '#1a1a1a' : '#cccccc';`;
code = code.replace(targetBrandColor, replaceBrandColor);

const targetBgGlowLight = `        case 'pinterest': return 'bg-gradient-to-b from-rose-100/60 via-pink-50/10 to-neutral-50';
        default: return 'bg-gradient-to-b from-neutral-100/80 via-neutral-50/40 to-neutral-50';`;
const replaceBgGlowLight = `        case 'pinterest': return 'bg-gradient-to-b from-rose-100/60 via-pink-50/10 to-neutral-50';
        case 'spotify': return 'bg-gradient-to-b from-green-100/60 via-emerald-50/10 to-neutral-50';
        case 'threads': return 'bg-gradient-to-b from-neutral-200/60 via-neutral-100/40 to-neutral-50';
        default: return 'bg-gradient-to-b from-neutral-100/80 via-neutral-50/40 to-neutral-50';`;
code = code.replace(targetBgGlowLight, replaceBgGlowLight);

const targetBgGlowDark = `      case 'snapchat': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#2C2A10_0%,#121105_70%,#000000_100%)]';
      default: return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#737373_0%,#404040_70%,#000000_100%)]';`;
const replaceBgGlowDark = `      case 'snapchat': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#2C2A10_0%,#121105_70%,#000000_100%)]';
      case 'spotify': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#2B5536_0%,#1A2E20_70%,#000000_100%)]';
      case 'threads': return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#444444_0%,#222222_70%,#000000_100%)]';
      default: return 'bg-[#000000] bg-[image:linear-gradient(to_bottom,#737373_0%,#404040_70%,#000000_100%)]';`;
code = code.replace(targetBgGlowDark, replaceBgGlowDark);

const targetTabColorLight = `                    case 'snapchat': return 'shadow-[0_0_15px_rgba(255,252,0,0.15)]';
                    default: return 'shadow-md';`;
const replaceTabColorLight = `                    case 'snapchat': return 'shadow-[0_0_15px_rgba(255,252,0,0.15)]';
                    case 'spotify': return 'shadow-[0_0_15px_rgba(29,185,84,0.15)]';
                    case 'threads': return 'shadow-[0_0_15px_rgba(0,0,0,0.1)]';
                    default: return 'shadow-md';`;
code = code.replace(targetTabColorLight, replaceTabColorLight);

const targetTabColorDark = `                  case 'snapchat': return 'shadow-[0_0_15px_rgba(255,252,0,0.4)]';
                  default: return 'shadow-md';`;
const replaceTabColorDark = `                  case 'snapchat': return 'shadow-[0_0_15px_rgba(255,252,0,0.4)]';
                  case 'spotify': return 'shadow-[0_0_15px_rgba(29,185,84,0.4)]';
                  case 'threads': return 'shadow-[0_0_15px_rgba(255,255,255,0.3)]';
                  default: return 'shadow-md';`;
code = code.replace(targetTabColorDark, replaceTabColorDark);

const targetGlowClass = `                    case 'snapchat': return 'hover:shadow-[0_0_20px_rgba(234,179,8,0.25)] dark:hover:shadow-[0_0_25px_rgba(234,179,8,0.35)] hover:border-yellow-500/40';
                    default: return 'hover:shadow-md';`;
const replaceGlowClass = `                    case 'snapchat': return 'hover:shadow-[0_0_20px_rgba(234,179,8,0.25)] dark:hover:shadow-[0_0_25px_rgba(234,179,8,0.35)] hover:border-yellow-500/40';
                    case 'spotify': return 'hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] dark:hover:shadow-[0_0_25px_rgba(34,197,94,0.35)] hover:border-green-500/40';
                    case 'threads': return 'hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:border-white/20';
                    default: return 'hover:shadow-md';`;
code = code.replace(targetGlowClass, replaceGlowClass);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched all color switchers");
