const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}`;

const replacement = `function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '';
  const k = 1024;
  // Never display in Bytes.
  if (bytes < k) {
    return (bytes / k).toFixed(1) + ' KB';
  }
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
