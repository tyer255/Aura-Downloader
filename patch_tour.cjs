const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      onPopoverRender: (popover, { driver }) => {
        if (!popover.footerButtons.querySelector('.driver-skip-btn')) {
          const skipBtn = document.createElement('button');
          skipBtn.className = 'driver-skip-btn';
          skipBtn.innerText = 'Skip Tour';
          skipBtn.style.cssText = 'background: none; border: none; font-size: 13px; font-weight: 500; cursor: pointer; margin-right: auto; padding: 5px 10px; color: #6b7280; border-radius: 6px; transition: background 0.2s;';
          skipBtn.onmouseover = () => skipBtn.style.background = '#f3f4f6';
          skipBtn.onmouseout = () => skipBtn.style.background = 'none';
          skipBtn.onclick = () => {
            driver.destroy();
          };
          popover.footerButtons.insertBefore(skipBtn, popover.footerButtons.firstChild);
        }
      },`;

const replacement = `      showButtons: ['next', 'previous'], // Default is next, prev, close
      // Remove custom onPopoverRender that overlaps`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched tour successfully!");
} else {
    console.log("Could not find target!");
}
