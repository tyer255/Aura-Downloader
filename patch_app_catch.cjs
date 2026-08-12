const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      } catch (err) {
           clearInterval(interval);
           setActiveDownloads(prev => ({`;

const replacement = `      } catch (err) {
           setActiveDownloads(prev => ({`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx catch block!");
} else {
  console.log("Target not found!");
}
