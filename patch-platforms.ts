import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            </motion.div>
          )}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}`;

const replacement = `            </motion.div>
          )}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Matched and fixed platforms!");
} else {
    console.log("no match platforms");
}
fs.writeFileSync('src/App.tsx', content);
