import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            </motion.div>
          </div>
        )}
          "w-full max-w-2xl border rounded-2xl p-2 flex items-center overflow-x-auto no-scrollbar mb-8 shadow-2xl relative z-10 transition-colors",`;

const replacement = `            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className={clsx(
          "w-full max-w-2xl border rounded-2xl p-2 flex items-center overflow-x-auto no-scrollbar mb-8 shadow-2xl relative z-10 transition-colors",`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Fixed div");
} else {
    console.log("No match div");
}
fs.writeFileSync('src/App.tsx', content);
