const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The code currently has:
/*
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      onPopoverRender: (popover, { driver }) => {
        if (!popover.footerButtons.querySelector('.driver-skip-btn')) {
          const skipBtn = document.createElement('button');
...
          popover.footerButtons.insertBefore(skipBtn, popover.footerButtons.firstChild);
        }
      },
      steps: [
*/

// Let's replace this entire block up to `steps: [` with a clean config.

const target = /const driverObj = driver\(\{[\s\S]*?steps: \[/;

const replacement = `const driverObj = driver({
      showProgress: true,
      allowClose: true,
      doneBtnText: 'Finish',
      nextBtnText: 'Next',
      prevBtnText: 'Prev',
      steps: [`;

if (target.test(code)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched tour config successfully!");
} else {
    console.log("Could not find tour config target!");
}
