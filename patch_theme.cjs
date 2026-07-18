const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetEffect = `  // Save theme selection
  React.useEffect(() => {
    try {
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    } catch (e) {}
  }, [isLight]);`;

const replacementEffect = `  // Save theme selection
  React.useEffect(() => {
    try {
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      if (isLight) {
        document.documentElement.classList.remove('dark');
        document.body.style.backgroundColor = '#fafafa';
      } else {
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#0a0a0a';
      }
    } catch (e) {}
  }, [isLight]);`;

if (content.includes(targetEffect)) {
  content = content.replace(targetEffect, replacementEffect);
  console.log("Theme effect patched successfully");
} else {
  console.log("Theme effect target not found");
}

const targetButtons = `              {/* Quick Actions Row */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8 w-full max-w-2xl relative z-20">`;

const replacementButtons = `              {/* Quick Actions Row */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6 mb-8 w-full max-w-2xl relative z-20">`;

if (content.includes(targetButtons)) {
  content = content.replace(targetButtons, replacementButtons);
  console.log("Buttons margin patched successfully");
} else {
  console.log("Buttons margin target not found");
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
