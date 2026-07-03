import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `function getProxiedUrl(url: string | undefined): string {`;
const replace1 = `function getProxiedUrl(url: string | undefined): string {
  if (!url) return "/images/avatar_placeholder.png";`;

if (code.includes(target1) && !code.includes("if (!url) return")) {
  code = code.replace(target1, replace1);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched getProxiedUrl");
} else {
  console.log("Already patched or target not found");
}
