import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const isWindows = process.platform === 'win32';
const xtractorFile = isWindows ? 'xtractor.exe' : 'xtractor';

if (!fs.existsSync(xtractorFile)) {
  console.log('Downloading xtractor...');
  try {
    const assetName = isWindows ? 'windows-amd64.zip' : 'linux-amd64.zip';
    const downloadUrl = `https://github.com/afkarxyz/xtractor-binaries/releases/download/v1.2/${assetName}`;
    
    execSync(`curl -L -o xtractor.zip ${downloadUrl}`);
    execSync(`unzip -o xtractor.zip`);
    if (!isWindows) {
      execSync(`chmod +x xtractor`);
    }
    fs.unlinkSync('xtractor.zip');
    console.log('xtractor downloaded successfully.');
  } catch (err) {
    console.error('Failed to download xtractor:', err.message);
  }
} else {
  console.log('xtractor already exists.');
}
