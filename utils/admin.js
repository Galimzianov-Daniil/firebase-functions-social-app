const serviceAccount = require("../serviceAccountKey.json"); // TODO: set your service account key

const admin = require("firebase-admin");

// TODO: set your data
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://twitter-clone-bf6fc.firebaseio.com",
    storageBucket: "twitter-clone-bf6fc.appspot.com"
});

const db = admin.firestore();

module.exports = { admin, db }