const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetImport = `import { requestNotificationPermission, showNotification } from './lib/notifications';`;
const replacementImport = `import { requestNotificationPermission, showNotification } from './lib/notifications';
import { TermsModal } from './components/TermsModal';`;

if (code.includes(targetImport)) {
    code = code.replace(targetImport, replacementImport);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched imports successfully!");
} else {
    console.log("Could not find imports target!");
}
