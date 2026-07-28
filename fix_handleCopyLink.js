import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const handleCopyLinkSearch = `  const handleCopyLink = async () => {
    try {
      const target = getSafeUrl(url, originalUrl);
      if (!target) return;
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };`;

const handleCopyLinkReplace = `  const handleCopyLink = async () => {
    try {
      const text = getShareText(url, originalUrl);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };`;

code = code.replace(handleCopyLinkSearch, handleCopyLinkReplace);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed handleCopyLink in QRCodeButton');
