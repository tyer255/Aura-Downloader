import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            </motion.div>
          )}
          <motion.div
            initial="hidden"`;

const replacement = `            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
            initial="hidden"`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Matched and fixed animate presence!");
} else {
    console.log("no match anim");
}
fs.writeFileSync('src/App.tsx', content);
