const functions = require('firebase-functions');
const { postScream, getAllScreams } = require("./handlers/scream");
const { signup, login, uploadImage, addUserDetails, getAuthentificatedUserData } = require("./handlers/users");
const FBAuth = require("./utils/fbAuth");

const app = require("express")();

// Scream routes
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postScream)
app.post("/user", FBAuth, addUserDetails)
app.get("/user", FBAuth, getAuthentificatedUserData)
app.post("/users/image", FBAuth, uploadImage)


// Users manage routes
app.post("/signup", signup)
app.post("/login", login)



exports.api = functions.https.onRequest(app)