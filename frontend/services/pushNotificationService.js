import API from "./api";

// Helper function to convert base64 VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the service worker
 */
export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker is not supported in this browser.");
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/"
    });
    return registration;
  } catch (error) {
    console.error("Service worker registration failed:", error);
    throw error;
  }
};

/**
 * Checks the current push subscription status
 */
export const getSubscriptionStatus = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { supported: false, enabled: false, permission: "default" };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return {
      supported: true,
      enabled: !!subscription,
      permission: Notification.permission
    };
  } catch (error) {
    console.error("Failed to check subscription status:", error);
    return { supported: true, enabled: false, permission: Notification.permission };
  }
};

/**
 * Subscribes the user browser to push notifications
 */
export const subscribeUserToPush = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  // 1. Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permission for notifications was denied.");
  }

  // 2. Register/retrieve service worker registration
  const registration = await registerServiceWorker();

  // 3. Fetch VAPID public key from backend
  const keyResponse = await API.get("/notifications/vapid-public-key");
  const vapidPublicKey = keyResponse.data?.data;
  if (!vapidPublicKey) {
    throw new Error("Failed to retrieve VAPID public key from server.");
  }

  // 4. Subscribe with the push manager
  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey
  });

  // 5. Send subscription info to backend
  const subJSON = subscription.toJSON();
  await API.post("/notifications/subscribe", {
    endpoint: subJSON.endpoint,
    keys: {
      p256dh: subJSON.keys.p256dh,
      auth: subJSON.keys.auth
    }
  });

  return true;
};

/**
 * Unsubscribes the user browser from push notifications
 */
export const unsubscribeUserFromPush = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return false; // Already unsubscribed
    }

    // 1. Unsubscribe locally
    await subscription.unsubscribe();

    // 2. Notify backend to clean up subscription record
    await API.post("/notifications/unsubscribe", {
      endpoint: subscription.endpoint
    });

    return true;
  } catch (error) {
    console.error("Failed to unsubscribe user from push:", error);
    throw error;
  }
};
