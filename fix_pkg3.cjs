const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('/app/applet/package.json', 'utf8'));
if (pkg.dependencies && pkg.dependencies.vite) {
    delete pkg.dependencies.vite;
}
fs.writeFileSync('/app/applet/package.json', JSON.stringify(pkg, null, 2));
