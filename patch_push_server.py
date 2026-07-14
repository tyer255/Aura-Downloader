import re

with open("server.ts", "r") as f:
    content = f.read()

import_statement = "import webpush from 'web-push';\nimport fs from 'fs';\n"
content = import_statement + content

push_logic = r'''

  // Web Push setup
  const vapidKeys = {
    publicKey: 'BHoQSTFIR9f-8G4vLeGwzdbzbmO4z_GvetdY0wd84U2QPYy2woYZ04dU76gxgmhC5eW-ULFEUizmx2GIp1c7Yk0',
    privateKey: 'uFUg29vDq77vqK8ejhu_YdmeXH_9wqgoXH3Y0H5mwq4'
  };
  webpush.setVapidDetails(
    'mailto:test@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  let subscriptions: any[] = [];
  const subsFile = path.join(process.cwd(), 'subscriptions.json');
  try {
    if (fs.existsSync(subsFile)) {
      subscriptions = JSON.parse(fs.readFileSync(subsFile, 'utf8'));
    }
  } catch (e) {
    console.error("Could not load subscriptions", e);
  }

  app.use(express.json());

  app.post("/api/push/subscribe", (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription" });
    }
    
    const existing = subscriptions.find(s => s.endpoint === subscription.endpoint);
    if (!existing) {
      subscriptions.push(subscription);
      fs.writeFileSync(subsFile, JSON.stringify(subscriptions));
    }
    res.status(201).json({});
  });

  app.post("/api/push/send", (req, res) => {
    const notificationPayload = {
      title: req.body.title || "New Update Available!",
      body: req.body.body || "Check out the latest features in AURA Downloader.",
      url: req.body.url || "/"
    };

    const promises = subscriptions.map((sub) =>
      webpush.sendNotification(sub, JSON.stringify(notificationPayload))
        .catch(err => {
          console.error("Error sending push to", sub.endpoint, err);
          if (err.statusCode === 410 || err.statusCode === 404) {
            return sub.endpoint; // Return endpoint to remove
          }
          return null;
        })
    );

    Promise.all(promises).then((results) => {
      const toRemove = results.filter(r => r !== null && r !== undefined);
      if (toRemove.length > 0) {
        subscriptions = subscriptions.filter(s => !toRemove.includes(s.endpoint));
        fs.writeFileSync(subsFile, JSON.stringify(subscriptions));
      }
      res.status(200).json({ message: "Notifications sent successfully" });
    });
  });

  app.get("/api/health", (req, res) => {
'''

content = content.replace('  app.get("/api/health", (req, res) => {', push_logic)

with open("server.ts", "w") as f:
    f.write(content)
