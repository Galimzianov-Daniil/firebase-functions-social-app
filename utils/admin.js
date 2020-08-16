const serviceAccount = require("../serviceAccountKey.json");

const admin = require("firebase-admin");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://social-app-80d1a.firebaseio.com",
    storageBucket: "social-app-80d1a.appspot.com"
});

const db = admin.firestore();

module.exports = { admin, db }