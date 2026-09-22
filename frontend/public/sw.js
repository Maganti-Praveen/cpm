// Service Worker for handling offline/background Web Push Notifications

self.addEventListener("push", (event) => {
  let data = { title: "New Notification", message: "You have a new update in Sai CRM." };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    console.error("Failed to parse push notification payload:", error);
    // Fallback if payload isn't JSON
    if (event.data) {
      data.message = event.data.text();
    }
  }

  const options = {
    body: data.message || data.body,
    icon: "/logo.webp",
    badge: "/logo.webp",
    data: {
      link: data.link || "/"
    },
    requireInteraction: true,
    vibrate: [100, 50, 100],
    actions: [
      { action: "open", title: "View Details" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetLink = event.notification.data?.link || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Find a client that is open on our origin
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            client.navigate(targetLink);
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetLink);
      }
    })
  );
});
