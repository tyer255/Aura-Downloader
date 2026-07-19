const fs = require('fs');
const html = fs.readFileSync('test_pin.html', 'utf8');
const match = html.match(/<script id="__PWS_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (match) {
    const data = JSON.parse(match[1]);
    fs.writeFileSync('pws_data.json', JSON.stringify(data, null, 2));
    console.log("Extracted successfully!");
}
