import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# I want to ensure my injection of deferredPrompt went inside DownloaderView function, let's verify
if "const [deferredPrompt, setDeferredPrompt]" in content:
    print("Found deferred prompt.")
    
    # Just checking where it is
    match = re.search(r'function DownloaderView\([^)]*\)\s*\{.*?const \[deferredPrompt', content, re.DOTALL)
    if match:
        print("It is inside DownloaderView.")
    else:
        print("Wait, it might not be inside DownloaderView.")
