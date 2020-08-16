const { db, admin } = require("../utils/admin");
const firebase = require("firebase")
const config = require("../utils/config")
const { validateSignupData, validateLoginData } = require("../utils/validators");
const { uuid } = require("uuidv4");


firebase.initializeApp(config)
const auth = firebase.auth()

const filePath = filename => `https://firebasestorage.googleapis.com/v0/b/social-app-80d1a.appspot.com/o/${filename}?alt=media`;

// https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${filename}?alt=media`;

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

exports.uploadImage = (req, res) => {
    const BusBoy = require("busboy");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");
    let generatedToken = uuid();

    const busboy = new BusBoy({ headers: req.headers });

    let newFileName, imageToBeUploaded;

    busboy.on("file", (fieldName, file, fileName, encoding, mimetype) => {

        if (mimetype !== "img/jpg" || mimetype !== "img/png") {
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
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype,
                        firebaseStorageDownloadTokens: generatedToken,
                    }
                }
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