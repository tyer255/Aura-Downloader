const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    list.forEach(q => {
      // Treat placeholder texts as missing sizes so we fetch the real size
      const isPlaceholder = q.size && String(q.size).match(/^[a-zA-Z\\s]+$/);
      if (q.url && (!q.size || isPlaceholder) && !fetchedSizes[q.url]) {
         fetchSize(q.url);
      }
    });`;

const replacement = `    // Process fetchSize sequentially or in small batches to prevent overloading the backend
    const processQueue = async () => {
      for (const q of list) {
        const isPlaceholder = q.size && String(q.size).match(/^[a-zA-Z\\s]+$/);
        if (q.url && (!q.size || isPlaceholder) && !fetchedSizes[q.url]) {
           await fetchSize(q.url);
           // Add a tiny delay to allow React to render each update and create a cascading animation
           await new Promise(r => setTimeout(r, 200));
        }
      }
    };
    processQueue();`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated useEffect to process sequentially");
