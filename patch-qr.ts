import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
    "          </div>\n        )}\n      </AnimatePresence>\n    </motion.div>\n  );\n}",
    "          </div>\n        )}\n      </AnimatePresence>\n    </>\n  );\n}"
);

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed QRCodeButton");
