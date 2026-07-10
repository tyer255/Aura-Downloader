const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    await setDoc(doc(db, 'config', 'admin'), {
      instagramEnabled: true
    });
    console.log("Success client sdk");
  } catch (e) {
    console.error(e.message);
  }
}
run();
