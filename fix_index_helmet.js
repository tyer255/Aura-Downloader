import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

// Add data-rh="true" to the static tags so Helmet can adopt them
html = html.replace(/<title>(.*?)<\/title>/, '<title data-rh="true">$1</title>');
html = html.replace(/<meta name="description" (.*?)\/>/, '<meta name="description" data-rh="true" $1/>');
html = html.replace(/<meta name="keywords" (.*?)\/>/, '<meta name="keywords" data-rh="true" $1/>');

// Open Graph
html = html.replace(/<meta property="og:title" (.*?)\/>/, '<meta property="og:title" data-rh="true" $1/>');
html = html.replace(/<meta property="og:description" (.*?)\/>/, '<meta property="og:description" data-rh="true" $1/>');
html = html.replace(/<meta property="og:type" (.*?)\/>/, '<meta property="og:type" data-rh="true" $1/>');
html = html.replace(/<meta property="og:url" (.*?)\/>/, '<meta property="og:url" data-rh="true" $1/>');

// Twitter
html = html.replace(/<meta name="twitter:card" (.*?)\/>/, '<meta name="twitter:card" data-rh="true" $1/>');
html = html.replace(/<meta name="twitter:title" (.*?)\/>/, '<meta name="twitter:title" data-rh="true" $1/>');
html = html.replace(/<meta name="twitter:description" (.*?)\/>/, '<meta name="twitter:description" data-rh="true" $1/>');

fs.writeFileSync('index.html', html);
console.log('Added data-rh to index.html');
