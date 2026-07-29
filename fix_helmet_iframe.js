import fs from 'fs';
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(
  'contentSecurityPolicy: false // disabled temporarily for dev/preview iframe',
  'contentSecurityPolicy: false, // disabled temporarily for dev/preview iframe\\n    xFrameOptions: false // allow iframe preview'
);
fs.writeFileSync('server.ts', server);
console.log('Disabled xFrameOptions in Helmet');
