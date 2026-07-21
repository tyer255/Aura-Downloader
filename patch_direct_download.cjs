const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  const downloadFileDirect = (url: string, filename: string) => {`;
const replacement1 = `  const downloadFileDirect = (url: string, filename: string) => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }`;

const target2 = `  const downloadFileClientSide = async (url: string, filename: string) => {`;
const replacement2 = `  const downloadFileClientSide = async (url: string, filename: string) => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }`;

if (code.includes(target1) && code.includes(target2)) {
    code = code.replace(target1, replacement1);
    code = code.replace(target2, replacement2);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched direct download successfully!");
} else {
    console.log("Could not find direct download targets!");
}
