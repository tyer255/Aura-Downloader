const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Replace low contrast text colors with higher contrast ones
appCode = appCode.replace(/text-neutral-400/g, 'text-neutral-500');
appCode = appCode.replace(/text-white\/40/g, 'text-white/60');
appCode = appCode.replace(/text-white\/50/g, 'text-white/70');
appCode = appCode.replace(/text-neutral-500/g, 'text-neutral-600');
// To prevent double replacement of 400 -> 500 -> 600, wait, it evaluates sequentially!
// It's better to use regex with capturing groups or function.

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/text-neutral-[45]00/g, (match) => {
    return match === 'text-neutral-400' ? 'text-neutral-400 dark:text-neutral-400' : 'text-neutral-600 dark:text-neutral-400';
});
code = code.replace(/text-white\/[45]0/g, (match) => {
    return match === 'text-white/40' ? 'text-white/70' : 'text-white/80';
});

// Fix heading order: change h4 to h2 or h3 depending on the context
// The user complained about heading elements not in a sequentially-descending order.
// Let's replace some h4/h3 to valid orders.

fs.writeFileSync('src/App.tsx', code);
console.log("Contrast patched!");
