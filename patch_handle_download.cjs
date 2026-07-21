const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!navigator.onLine) {`;

const replacement = `  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    
    if (!navigator.onLine) {`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched handleDownload successfully!");
} else {
    console.log("Could not find handleDownload target!");
}
