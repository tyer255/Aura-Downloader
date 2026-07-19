const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('/app/applet/package.json', 'utf8'));
delete pkg.scripts.prebuild;
delete pkg.scripts.predev;
delete pkg.scripts.prestart;
delete pkg.scripts["setup-python"];
pkg.scripts.build = "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs";
fs.writeFileSync('/app/applet/package.json', JSON.stringify(pkg, null, 2));
