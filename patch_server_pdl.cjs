const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const target = `        if (platform === 'pinterest') {
           console.log("Trying gallery-dl for Pinterest...");
           const gdlResult = await extractWithGalleryDl(trimmedUrl);
           if (gdlResult) {
               if (gdlResult.success) {
                   return res.json(gdlResult);
               } else {
                   return res.status(500).json(gdlResult);
               }
           } else {
               return res.status(500).json({ success: false, message: "Failed to extract Pinterest media. Ensure the link is public." });
           }
        }`;

const replace = `        if (platform === 'pinterest') {
           console.log("Trying pinterest-dl for Pinterest...");
           const pdlResult = await extractWithPinterestDl(trimmedUrl);
           if (pdlResult) {
               if (pdlResult.success) {
                   return res.json(pdlResult);
               } else {
                   return res.status(500).json(pdlResult);
               }
           } else {
               return res.status(500).json({ success: false, message: "Failed to extract Pinterest media. Ensure the link is public." });
           }
        }`;

if (code.includes(target)) {
    code = code.replace(target, replace);
    fs.writeFileSync('/app/applet/server.ts', code);
    console.log("Patched server for pinterest-dl logic successfully!");
} else {
    console.log("Target not found!");
}
