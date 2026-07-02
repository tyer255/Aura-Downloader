import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `  let instances = [
    'https://api.cobalt.tools',
    'https://cobalt-api.pewpew.nyc',
    'https://co.wuk.sh',
    'https://cobalt.tu.fo',
    'https://cobalt.qewertyy.dev',
    'https://rue-cobalt.xenon.zone',
    'https://cobalt.kwiatekit.com',
    'https://cobalt.wuk.sh',
    'https://dl.phazed.xyz'
  ];`;

const replacementStr = `  let instances = [
    'https://api.cobalt.tools',
    'https://cobalt-api.pewpew.nyc',
    'https://co.wuk.sh',
    'https://cobalt.tu.fo',
    'https://cobalt.qewertyy.dev',
    'https://rue-cobalt.xenon.zone',
    'https://api.cobalt.blackcat.sweeux.org',
    'https://co.eepy.today',
    'https://cobalt.kwiatekit.com',
    'https://cobalt.wuk.sh',
    'https://dl.phazed.xyz',
    'https://c.alyx.top',
    'https://cobalt.owo.network'
  ];`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log("Patched cobalt instances successfully!");
} else {
  console.log("Could not find target string.");
}
