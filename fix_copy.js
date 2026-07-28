import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCopy = `  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };`;

const newCopy = `  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const target = getSafeUrl(url, originalUrl);
      if (!target) return;
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };`;

code = code.replace(oldCopy, newCopy);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed handleCopy in CopyButton!');
