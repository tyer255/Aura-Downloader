const admin = require('firebase-admin');
const config = require('./firebase-applet-config.json');
admin.initializeApp({
  projectId: config.projectId
});
const db = admin.firestore();
// Need to set databaseId too. 
db.settings({ databaseId: config.firestoreDatabaseId });
db.collection('test').doc('test').set({ hello: 'world' }).then(() => {
  console.log('Success');
}).catch(console.error);
