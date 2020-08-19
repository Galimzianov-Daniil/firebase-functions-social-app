const functions = require('firebase-functions');
const {
    postScream,
    getAllScreams,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream
} = require("./handlers/scream");
const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getAuthentificatedUserData,
    markNotificationsRead,
    getUserDetails
} = require("./handlers/users");
const FBAuth = require("./utils/fbAuth");
const { db } = require("./utils/admin");

const app = require("express")();

// Scream routes
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postScream)
app.get("/scream/:screamId/", getScream)
app.post("/scream/:screamId/delete", FBAuth, deleteScream)
app.post("/scream/:screamId/like", FBAuth, likeScream)
app.post("/scream/:screamId/unlike", FBAuth, unlikeScream)
app.post("/scream/:screamId/comment", FBAuth, commentOnScream)

// User routes
app.get("/user", FBAuth, getAuthentificatedUserData)
app.get("/user/:handle", getUserDetails)
app.post("/user", FBAuth, addUserDetails)
app.post("/user/image", FBAuth, uploadImage)

// Notification functionality
app.post("/notifications", FBAuth, markNotificationsRead)

// Users manage routes
app.post("/signup", signup)
app.post("/login", login)

exports.api = functions.https.onRequest(app)

exports.createNotificationOnLike = functions
    .firestore.document('/likes/{id}')
    .onCreate((snapshot) => {
        return db
            .doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then((doc) => {
                if (
                    doc.exists
                    && doc.data().handle !== snapshot.data().handle
                ) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().handle,
                        type: 'like',
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .catch((err) => console.error(err));
    });

exports.deleteNotificationOnUnlike = functions.firestore.document("/likes/{id}")
    .onDelete(snapshot => {
        return db.doc(`/notifications/${snapshot.id}`).delete()
            .catch(err => console.error(err))
    })

exports.createNotificationOnComment = functions.firestore.document("/comments/{id}")
    .onCreate(snapshot => {
        db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                if (
                    doc.exists
                    && doc.data().handle !== snapshot.data().handle
                ) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().handle,
                        sender: snapshot.data().handle,
                        type: "comment",
                        read: false,
                        screamId: doc.id
                    })
                }
            })
            .catch(err => console.error(err))

    })

exports.onUserImgChange = functions.firestore.document("/users/{userId}")
    .onUpdate(change => {

        let batch = db.batch();

        if (change.after.data().imageUrl !== change.before.data().imageUrl ) {

            return db.collection("screams")
                .where("userHandle", "==", change.before.data().handle)
                .get()
                .then(data => {
                    data.forEach(doc => {
                        const scream = db.doc(`/screams/${doc.id}`);
                        batch.update(scream, { userImg: change.after.data().imageUrl })
                    })
                })
                .then(() => batch.commit())
                .catch(err => console.error(err))

        } else return true;

    })
