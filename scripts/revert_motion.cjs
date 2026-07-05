const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace("import { m as motion, LazyMotion, domAnimation, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';");
content = content.replace('    <LazyMotion features={domAnimation}>\n    <div className={clsx(', '    <div className={clsx(');
content = content.replace('</div>\n    </LazyMotion>\n    </>\n  );\n}', '</div>\n    </>\n  );\n}');

fs.writeFileSync('src/App.tsx', content);
