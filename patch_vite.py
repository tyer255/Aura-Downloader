import re

with open("vite.config.ts", "r") as f:
    content = f.read()

if "VitePWA" not in content:
    content = "import { VitePWA } from 'vite-plugin-pwa';\n" + content
    content = content.replace("plugins: [react(), tailwindcss()],", """plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png'],
      manifest: false, // We already have manifest.json in public/
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],""")
    
    with open("vite.config.ts", "w") as f:
        f.write(content)
    print("Patched vite config for PWA")
else:
    print("Already has VitePWA")
