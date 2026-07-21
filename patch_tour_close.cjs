const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      doneBtnText: 'Finish',
      nextBtnText: 'Next',
      prevBtnText: 'Prev',`;

const replacement = `      doneBtnText: 'Finish',
      nextBtnText: 'Next',
      prevBtnText: 'Prev',
      showButtons: ['next', 'previous', 'close'],`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched tour showButtons successfully!");
} else {
    console.log("Could not find target!");
}
