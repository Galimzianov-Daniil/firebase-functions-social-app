const functions = require('firebase-functions');
const {
    postScream,
    getAllScreams,
    getScream,
    commentOnScream
} = require("./handlers/scream");
const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getAuthentificatedUserData
} = require("./handlers/users");
const FBAuth = require("./utils/fbAuth");

const app = require("express")();

// Scream routes
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postScream)
app.get("/scream/:screamId/", getScream)
// TODO: delete scream
// TODO: like scream
// TODO: unlike scream
app.post("/scream/:screamId/createComment", FBAuth, commentOnScream)


// User routes
app.get("/user", FBAuth, getAuthentificatedUserData)
app.post("/user", FBAuth, addUserDetails)
app.post("/user/image", FBAuth, uploadImage)

// Users manage routes
app.post("/signup", signup)
app.post("/login", login)

exports.api = functions.https.onRequest(app)