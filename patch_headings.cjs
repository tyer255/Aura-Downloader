const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace <h4> with <div className="...">
code = code.replace(/<h4/g, '<div');
code = code.replace(/<\/h4>/g, '</div>');

// Keep h1, h2, h3. They seem mostly fine, but we can replace h3 with h2 in places where they are the primary section heading.
// Actually, it's safer to just change the ones causing problems.

fs.writeFileSync('src/App.tsx', code);
console.log("Headings patched!");
