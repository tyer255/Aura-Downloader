import fs from 'fs';
let serverCode = fs.readFileSync('server.ts', 'utf8');

// Replace standard e.message inside json responses to hide it from users
serverCode = serverCode.replace(/message: e\.message/g, 'message: "Extraction failed. Please try again later."');
serverCode = serverCode.replace(/message: error\.message/g, 'message: "Extraction failed. Please try again later."');
serverCode = serverCode.replace(/error: e\.message/g, 'error: "Extraction failed. Please try again later."');
serverCode = serverCode.replace(/error: error\.message/g, 'error: "Extraction failed. Please try again later."');
serverCode = serverCode.replace(/message: String\(e\)/g, 'message: "Extraction failed. Please try again later."');
serverCode = serverCode.replace(/error: String\(e\)/g, 'error: "Extraction failed. Please try again later."');
serverCode = serverCode.replace(/message: String\(error\)/g, 'message: "Extraction failed. Please try again later."');
serverCode = serverCode.replace(/error: String\(error\)/g, 'error: "Extraction failed. Please try again later."');

fs.writeFileSync('server.ts', serverCode);
console.log('Fixed server.ts successfully');
