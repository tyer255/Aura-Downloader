const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = fs.readFileSync(path.join(__dirname, 'public/icon.svg'));

sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile(path.join(__dirname, 'public/icon-192.png'))
  .then(() => console.log('icon-192.png generated'))
  .catch(err => console.error(err));

sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(path.join(__dirname, 'public/icon-512.png'))
  .then(() => console.log('icon-512.png generated'))
  .catch(err => console.error(err));
