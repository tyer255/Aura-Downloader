import re

with open("src/App.tsx", "r") as f:
    content = f.read()

import_statement = "import { subscribeUserToPush } from './push';\n"
content = content.replace("import { m as motion, LazyMotion, domMax, AnimatePresence } from 'motion/react';", "import { m as motion, LazyMotion, domMax, AnimatePresence } from 'motion/react';\n" + import_statement)

with open("src/App.tsx", "w") as f:
    f.write(content)
