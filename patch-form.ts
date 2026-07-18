import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                )}
                <div className={clsx(
                  "relative flex items-center w-full border rounded-full p-2 pl-6 sm:pl-8 shadow-2xl backdrop-blur-xl group transition-all",`;

const replacement = `                )}
              <form onSubmit={handleDownload} className="w-full relative z-20">
                <div className={clsx(
                  "relative flex items-center w-full border rounded-full p-2 pl-6 sm:pl-8 shadow-2xl backdrop-blur-xl group transition-all",`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Matched and fixed form!");
} else {
    console.log("no match form");
}
fs.writeFileSync('src/App.tsx', content);
