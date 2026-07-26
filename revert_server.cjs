const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
const lines = code.split('\n');

const replaceLine = (num, from, to) => {
    lines[num - 1] = lines[num - 1].replace(from, to);
};

replaceLine(293, 'size: undefined', 'size: q >= 720 ? "High Definition" : "Standard Quality"');
replaceLine(303, 'size: undefined', 'size: "Ready"');
replaceLine(345, 'size: undefined', 'size: "High Definition"');
replaceLine(345, 'size: undefined', 'size: "Audio Only"');
replaceLine(435, 'size: undefined', 'size: "Video"');
replaceLine(450, 'size: undefined', 'size: "Video"');
replaceLine(863, 'size: undefined', 'size: "High Definition"');
replaceLine(864, 'size: undefined', 'size: "Standard HD"');
replaceLine(865, 'size: undefined', 'size: "Standard Definition"');
replaceLine(866, 'size: undefined', 'size: "Low Bandwidth"');
replaceLine(867, 'size: undefined', 'size: "Audio Only"');
replaceLine(1428, 'size: undefined', 'size: "HD"');
replaceLine(1429, 'size: undefined', 'size: "Audio"');

fs.writeFileSync('server.ts', lines.join('\n'));
console.log("Reverted sizes in server.ts");
