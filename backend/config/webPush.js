import webpush from "web-push";

let publicKey = process.env.VAPID_PUBLIC_KEY;
let privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:support@saiitservices.com";

if (!publicKey || !privateKey) {
  console.warn("==================================================================================");
  console.warn("WARNING: VAPID keys are not configured in your environment variables (.env).");
  console.warn("Generating temporary keys on-the-fly for development...");
  
  const keys = webpush.generateVAPIDKeys();
  publicKey = keys.publicKey;
  privateKey = keys.privateKey;
  
  console.warn("----------------------------------------------------------------------------------");
  console.warn("Add these lines to your backend .env file to persist push subscriptions:");
  console.warn(`VAPID_PUBLIC_KEY="${publicKey}"`);
  console.warn(`VAPID_PRIVATE_KEY="${privateKey}"`);
  console.warn("==================================================================================");
}

try {
  webpush.setVapidDetails(subject, publicKey, privateKey);
} catch (error) {
  console.error("Failed to set VAPID details:", error.message);
}

export { webpush, publicKey };
