const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const config = require('./firebase-applet-config.json');
const app = admin.initializeApp({
  projectId: config.projectId
});
const db = getFirestore(app, config.firestoreDatabaseId);
db.collection('test').doc('test').set({ hello: 'world' }).then(() => {
  console.log('Success');
}).catch(console.error);
