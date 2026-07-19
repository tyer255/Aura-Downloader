import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\)\}\s+className="w-full py-2\.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-white\/10 text-center hover:scale-\[1\.01\] active:scale-\[0\.99\] bg-white\/5 hover:bg-white\/10 text-white"\s+>/;

if (regex.test(content)) {
    content = content.replace(regex, `)}
              </AnimatePresence>
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-white/10 text-center hover:scale-[1.01] active:scale-[0.99] bg-white/5 hover:bg-white/10 text-white"
                >`);
    console.log("Matched and replaced!");
} else {
    console.log("no match");
}
fs.writeFileSync('src/App.tsx', content);
