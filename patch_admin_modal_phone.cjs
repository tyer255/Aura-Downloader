const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

code = code.replace(/<p className="text-\[10px\] text-zinc-500 mt-1">Get this from instagram.com cookies \(Application tab in DevTools → Cookies → sessionid\)<\/p>/, 
  '<p className="text-[10px] text-zinc-500 mt-1">Get this from instagram.com cookies. On a phone, use an app like EditThisCookie (via Kiwi Browser) or do this once on a computer (DevTools → Application → Cookies → sessionid).</p>');

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Patched AdminModal.tsx phone text.");
