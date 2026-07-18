import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
    "          )}\n              id=\"tour-results\"",
    "          )}\n        </AnimatePresence>\n\n        {/* Results Area */}\n        <AnimatePresence mode=\"wait\">\n          {result && !isLoading && (\n            <motion.div\n              id=\"tour-results\""
);

fs.writeFileSync('src/App.tsx', content);
console.log("Restored missing lines");
