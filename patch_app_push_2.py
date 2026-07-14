import re

with open("src/App.tsx", "r") as f:
    content = f.read()

import_statement = "import { subscribeUserToPush } from './push';\n"
content = content.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\n" + import_statement)

use_effect = """
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      subscribeUserToPush();
    }
  }, []);
"""

content = content.replace("  const [showSettings, setShowSettings] = useState(false);", "  const [showSettings, setShowSettings] = useState(false);\n" + use_effect)

with open("src/App.tsx", "w") as f:
    f.write(content)
