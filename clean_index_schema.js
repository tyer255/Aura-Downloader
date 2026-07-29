import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

// Remove the SoftwareApplication schema from index.html
html = html.replace(/<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "SoftwareApplication"[\s\S]*?<\/script>/, '');

fs.writeFileSync('index.html', html);
console.log('Removed SoftwareApplication from index.html');
