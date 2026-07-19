import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
    "          </motion.div>\n        )}\n    </div>",
    "          </motion.div>\n        )}\n      </AnimatePresence>\n    </div>"
);

fs.writeFileSync('src/App.tsx', content);
console.log("Restored missing AnimatePresence");
