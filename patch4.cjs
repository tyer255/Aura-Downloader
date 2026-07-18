const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `placeholder="Optional: Enter Twitter auth_token cookie to bypass rate limits"`;
const replacement = `placeholder="Optional: Enter Twitter auth_token cookie"`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
