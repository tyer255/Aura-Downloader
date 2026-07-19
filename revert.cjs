const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetContainer = `"min-h-screen flex flex-col items-center pt-24 sm:pt-28 pb-12 px-4 font-sans transition-colors duration-700",
      isLight ? "bg-gradient-to-b text-neutral-900 selection:bg-red-500/10" : "bg-transparent text-neutral-50 selection:bg-red-500/30",
      getBgGlow(activeTab)`;

const replacementContainer = `"min-h-screen bg-gradient-to-b flex flex-col items-center pt-24 sm:pt-28 pb-12 px-4 font-sans transition-colors duration-700",
      isLight ? "text-neutral-900 selection:bg-red-500/10" : "text-neutral-50 selection:bg-red-500/30",
      getBgGlow(activeTab)`;

content = content.replace(targetContainer, replacementContainer);

const targetGlow = `    return '';`;

const replacementGlow = `    switch(id) {
      case 'youtube':
      case 'instagram': return 'from-purple-950/40 via-[#180a14] to-[#0a040b]';
      case 'tiktok': return 'from-cyan-950/30 via-[#0a1416] to-[#04090b]';
      case 'facebook': return 'from-blue-950/40 via-[#0b0e1a] to-[#05070f]';
      case 'reddit': return 'from-orange-950/40 via-[#1b0d0a] to-[#0f0705]';
      case 'pinterest': return 'from-rose-950/40 via-[#1a0a0f] to-[#0f0508]';
      default: return 'from-[#1c1917]/20 via-[#141210] to-[#0c0a09]';
    }`;

content = content.replace(targetGlow, replacementGlow);

const targetEffect = `  // Save theme selection
  React.useEffect(() => {
    try {
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      if (isLight) {
        document.documentElement.classList.remove('dark');
        document.body.style.background = '#fafaf9';
      } else {
        document.documentElement.classList.add('dark');
        
        let color1 = 'rgba(64, 116, 255, 0.15)';
        let color2 = 'rgba(255, 100, 200, 0.1)';
        
        switch (activeTab) {
          case 'youtube':
            color1 = 'rgba(255, 0, 0, 0.15)'; color2 = 'rgba(255, 100, 100, 0.1)'; break;
          case 'instagram':
            color1 = 'rgba(193, 53, 132, 0.15)'; color2 = 'rgba(253, 29, 29, 0.1)'; break;
          case 'tiktok':
            color1 = 'rgba(0, 242, 254, 0.15)'; color2 = 'rgba(254, 44, 85, 0.1)'; break;
          case 'facebook':
            color1 = 'rgba(24, 119, 242, 0.15)'; color2 = 'rgba(64, 116, 255, 0.1)'; break;
          case 'reddit':
            color1 = 'rgba(255, 69, 0, 0.15)'; color2 = 'rgba(255, 150, 50, 0.1)'; break;
          case 'pinterest':
            color1 = 'rgba(230, 0, 35, 0.15)'; color2 = 'rgba(255, 100, 100, 0.1)'; break;
          default:
            color1 = 'rgba(255, 255, 255, 0.1)'; color2 = 'rgba(150, 150, 150, 0.05)'; break;
        }

        document.body.style.background = \`radial-gradient(circle at 20% 50%, \${color1} 0%, transparent 50%), radial-gradient(circle at 80% 80%, \${color2} 0%, transparent 50%), linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)\`;
      }
    } catch (e) {}
  }, [isLight, activeTab]);`;

const replacementEffect = `  // Save theme selection
  React.useEffect(() => {
    try {
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      if (isLight) {
        document.documentElement.classList.remove('dark');
        document.body.style.backgroundColor = '#fafaf9';
        document.body.style.background = '';
      } else {
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#0c0a09';
        document.body.style.background = '';
      }
    } catch (e) {}
  }, [isLight]);`;

content = content.replace(targetEffect, replacementEffect);

fs.writeFileSync('src/App.tsx', content, 'utf8');

// Also index.html
let htmlContent = fs.readFileSync('index.html', 'utf8');
htmlContent = htmlContent.replace(/document\.documentElement\.style\.background = 'linear-gradient\\(135deg, #0f0f23 0%, #1a1a2e 100%\\)';/g, "document.documentElement.style.backgroundColor = '#0c0a09';");
htmlContent = htmlContent.replace(/document\.documentElement\.style\.background = '#fafaf9';/g, "document.documentElement.style.backgroundColor = '#fafaf9';");
fs.writeFileSync('index.html', htmlContent, 'utf8');
