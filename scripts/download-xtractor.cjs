const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

if (!fs.existsSync('xtractor')) {
  console.log('Downloading xtractor binary...');
  try {
    execSync('wget -qO xtractor.zip https://github.com/afkarxyz/xtractor-binaries/releases/download/v1.2/linux-amd64.zip');
    execSync('unzip -q -o xtractor.zip && chmod +x xtractor');
    execSync('rm xtractor.zip');
    console.log('xtractor downloaded successfully');
  } catch (e) {
    console.error('Failed to download xtractor:', e.message);
  }
} else {
  console.log('xtractor already exists.');
}
