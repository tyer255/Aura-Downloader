import re

with open("src/App.tsx", "r") as f:
    content = f.read()

import_statement = "import NotificationRequest from './components/NotificationRequest';\n"
content = content.replace("import ReloadPrompt from './components/ReloadPrompt';", "import ReloadPrompt from './components/ReloadPrompt';\n" + import_statement)

injection = "<ReloadPrompt isLight={isLight} />\n      <NotificationRequest isLight={isLight} />"
content = content.replace("<ReloadPrompt isLight={isLight} />", injection)

with open("src/App.tsx", "w") as f:
    f.write(content)
