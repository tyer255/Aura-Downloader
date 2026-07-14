import json

with open("package.json", "r") as f:
    pkg = json.load(f)

# Append the notify script to the build command
# Only run it if it hasn't been added yet
if 'node scripts/notify-deploy.cjs' not in pkg['scripts']['build']:
    pkg['scripts']['build'] += ' && node scripts/notify-deploy.cjs'

with open("package.json", "w") as f:
    json.dump(pkg, f, indent=2)
