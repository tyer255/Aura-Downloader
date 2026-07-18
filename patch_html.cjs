const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const target = `  <head>
    <meta charset="UTF-8" />`;

const replacement = `  <head>
    <meta charset="UTF-8" />
    <script>
      try {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.style.backgroundColor = '#0a0a0a';
        } else {
          document.documentElement.style.backgroundColor = '#fafafa';
        }
      } catch (e) {}
    </script>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('index.html', content, 'utf8');
  console.log("HTML patched successfully");
} else {
  console.log("HTML target not found");
}
