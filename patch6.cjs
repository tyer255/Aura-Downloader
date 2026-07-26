const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  `        } else if (platform === 'snapchat') {
          errorMsg = "This Snapchat content is private or unavailable.";
        }`,
  `        } else if (platform === 'snapchat') {
          if (!trimmedUrl.includes("/spotlight/") && !trimmedUrl.includes("/s/") && !trimmedUrl.includes("/p/") && !trimmedUrl.includes("/add/") && !trimmedUrl.includes("@")) {
            errorMsg = "Invalid Snapchat URL.";
          } else {
            errorMsg = "This Snapchat content is private or unavailable.";
          }
        }`
);

fs.writeFileSync('server.ts', serverContent);
console.log("Patched Snapchat specific error messages");
