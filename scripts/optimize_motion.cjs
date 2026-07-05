const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace("import { motion, AnimatePresence } from 'motion/react';", "import { m as motion, LazyMotion, domAnimation, AnimatePresence } from 'motion/react';");

const startDiv = '    <div className={clsx(\n        "min-h-screen';
content = content.replace(startDiv, '    <LazyMotion features={domAnimation}>\n' + startDiv);

const endDiv = '      `}} />\n    </div>\n    </>\n  );\n}';
content = content.replace(endDiv, '      `}} />\n    </div>\n    </LazyMotion>\n    </>\n  );\n}');

fs.writeFileSync('src/App.tsx', content);
