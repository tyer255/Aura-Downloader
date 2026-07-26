const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `const sizeDisplay = q.size || fetchedSizes[q.url] || (q.isAudio ? "MP3 Audio" : "Unknown Size");`;
const replacement = `const isPlaceholder = q.size && String(q.size).match(/^[a-zA-Z\\s]+$/);
                                      const sizeDisplay = fetchedSizes[q.url] && fetchedSizes[q.url] !== "Size Unknown" 
                                          ? fetchedSizes[q.url] 
                                          : (!isPlaceholder && q.size ? q.size : (q.isAudio ? "MP3 Audio" : "Unknown Size"));`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated sizeDisplay logic");
