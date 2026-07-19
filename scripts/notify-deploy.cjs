const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeys = {
  publicKey: 'BHoQSTFIR9f-8G4vLeGwzdbzbmO4z_GvetdY0wd84U2QPYy2woYZ04dU76gxgmhC5eW-ULFEUizmx2GIp1c7Yk0',
  privateKey: 'uFUg29vDq77vqK8ejhu_YdmeXH_9wqgoXH3Y0H5mwq4'
};

webpush.setVapidDetails(
  'mailto:test@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const subsFile = path.join(process.cwd(), 'subscriptions.json');
if (fs.existsSync(subsFile)) {
  const subscriptions = JSON.parse(fs.readFileSync(subsFile, 'utf8'));
  const notificationPayload = {
    title: "AURA Downloader Updated! 🚀",
    body: "We've just deployed a new version of the app. Check out the latest features and improvements!",
    url: "/"
  };

  console.log(`Found ${subscriptions.length} subscriptions. Sending push notifications...`);

  const promises = subscriptions.map((sub) =>
    webpush.sendNotification(sub, JSON.stringify(notificationPayload))
      .catch(err => console.error("Failed to send push to a subscriber.", err.statusCode || err))
  );

  Promise.all(promises).then(() => {
    console.log(`Push notifications dispatched.`);
    process.exit(0);
  });
} else {
  console.log("No subscriptions.json found. Skipping deploy notification.");
  process.exit(0);
}
