import re

with open("src/components/ReloadPrompt.tsx", "r") as f:
    content = f.read()

use_effect = """
  React.useEffect(() => {
    if (needRefresh && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('App Updated!', {
          body: 'A new version of AURA Downloader is available. Refresh to use the latest features!',
          icon: '/icon-192.png'
        });
      } catch (e) {
        // Some browsers require Service Worker registration to show notifications
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification('App Updated!', {
            body: 'A new version of AURA Downloader is available. Refresh to use the latest features!',
            icon: '/icon-192.png'
          });
        });
      }
    }
  }, [needRefresh]);
"""

content = content.replace("  return (", use_effect + "\n  return (")

with open("src/components/ReloadPrompt.tsx", "w") as f:
    f.write(content)
