const { db, admin } = require("../utils/admin");
const firebase = require("firebase")
const config = require("../utils/config")
const { validateSignupData, validateLoginData, reduceUserDetails } = require("../utils/validators");

firebase.initializeApp(config)
const auth = firebase.auth()

const filePath = filename => `https://firebasestorage.googleapis.com/v0/b/social-app-80d1a.appspot.com/o/${filename}?alt=media`;

// Sign up user
exports.signup = (req, res) => {

    const newUser = { ...req.body }
    const { valid, errors } = validateSignupData(newUser)

    if (!valid) return res.status(400).json(errors)

    let userId, token;

    db.doc(`/users/${newUser.handle}`).get()
        .then(({ exists}) => {
            if (exists) {
                return res.status(400).json({ handle: "this handle is already taken" })
            } else {
                return auth.createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken()
        })
        .then(userToken => {
            token = userToken;

            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                imageUrl: filePath("NoImg.png"),
                userId
            }

            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
        })
        .then(() => res.status(201).json({ token }))
        .catch(err => res.status(500).json({ error: err.code }))

}

// Log in user
exports.login = (req, res) => {

    const user = { ...req.body };
    const { valid, errors } = validateLoginData(user)

    if (!valid) return res.status(400).json(errors)

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => data.user.getIdToken())
        .then(token => res.json({ token }))
        .catch(err => {
            if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
                return res.status(403).json({ general: "Wrong credentials, please try again" })
            } else res.status(500).json({ error: err.code })
        })

}

// Add user details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);
    db.doc(`/users/${req.user.handle}`).update(userDetails)
        .then(() => res.json({ message: "Details added successfully" }))
        .catch(err => res.status(500).json({ error: err.code }))
}

// Get user details
exports.getAuthentificatedUserData = (req, res) => {
    let userData = {};

    db.doc(`/users/${req.user.handle}`).get()
        .then(doc => {

            if (doc.exists) {
                userData.credentials = doc.data()
                return db.collection("likes")
                    .where("userHandle", "==", req.user.handle)
                    .get()
            }

        })
        .then(data => {
            userData.likes = []
            data.forEach(doc => {
                userData.likes.push(doc.data())
            })
            return res.json(userData)
        })
        .catch(err => res.status(500).json({ error: err.code }))
}

// Upload profile Image
exports.uploadImage = (req, res) => {
    const BusBoy = require("busboy");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");

    const busboy = new BusBoy({ headers: req.headers });

    let newFileName, imageToBeUploaded;

    busboy.on("file", (fieldName, file, fileName, encoding, mimetype) => {
        console.log(mimetype);
        if (mimetype !== "image/jpg" && mimetype !== "image/png") {
            return res.status(400).json({ error: "Wrong file type submitted" })
        }

        const splitFileName = fileName.split(".");
        const imageExtension = splitFileName[splitFileName.length - 1]

        newFileName = `${Math.round(Math.random() * 1000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), newFileName)

        imageToBeUploaded = { filepath, mimetype }

        file.pipe(fs.createWriteStream(filepath))
    })

    busboy.on("finish", () => {

        console.log(filePath(newFileName))

        admin.storage().bucket()
            .upload(imageToBeUploaded.filepath, {
                resumable: false,
                metadata: { metadata: { contentType: imageToBeUploaded.mimetype } }
            })
            .then(() => {
                const imageUrl = filePath(newFileName);
                return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
            })
            .then(() => res.json({ message: "Image uploaded successfully" }))
            .catch(err => res.status(500).json({ error: err.code }))

    });

    busboy.end(req.rawBody)

}