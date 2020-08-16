const functions = require('firebase-functions');
const { postScream, getAllScreams } = require("./handlers/scream");
const { signup, login, uploadImage } = require("./handlers/users");
const FBAuth = require("./utils/fbAuth");

const app = require("express")();

// Scream routes
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postScream)

// Users manage routes
app.post("/signup", signup)
app.post("/login", login)
app.post("/users/image", FBAuth, uploadImage)

exports.api = functions.https.onRequest(app)