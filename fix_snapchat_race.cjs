const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The race block ends like:
//        } else {
//            racePromises.push(extractGenericRapidAPI(trimmedUrl, "unknown"));
//            racePromises.push(extractWithYtDlp(trimmedUrl));
//        }

const replacement = `
        } else if (platform === 'snapchat') {
            racePromises.push(extractGenericRapidAPI(trimmedUrl, "snapchat"));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else {
`;

code = code.replace(/\} else \{\s*racePromises\.push\(extractGenericRapidAPI\(trimmedUrl, "unknown"\)\);\s*racePromises\.push\(extractWithYtDlp\(trimmedUrl\)\);\s*\}/g, replacement + `            racePromises.push(extractGenericRapidAPI(trimmedUrl, "unknown"));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        }`);

fs.writeFileSync('server.ts', code);
