export function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    try {
      new Notification(title, options);
    } catch (e) {
      console.warn("Could not show notification", e);
    }
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        try {
          new Notification(title, options);
        } catch (e) {
           console.warn("Could not show notification", e);
        }
      }
    });
  }
}
