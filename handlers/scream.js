const { db } = require("../utils/admin");
const { isEmpty } = require("../utils/validators");

exports.getAllScreams = (req, res) => {
    db.collection("screams").orderBy("createdAt", "desc").get()
        .then(data => {
            let screams = []
            data.forEach(doc => screams.push({
                screamId: doc.id,
                ...doc.data()
            }))
            return res.json(screams);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

exports.postScream = (req, res) => {
    if (req.method !== "POST") return res.status(400).json({ message: "Method not allowed" })

    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString()
    }

    db.collection("screams").add(newScream)
        .then(doc => {
            return res.json({ message: `document ID: ${doc.id} created successfully` });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

exports.getScream = (req, res) => {
    let screamData = {};

    db.doc(`/screams/${req.params.screamId}`).get()
        .then(doc => {
            if (!doc.exists) return res.status(404).json({ error: "Scream not found" })
            screamData = doc.data()
            screamData.screamId = doc.id;
            return db.collection("comments")
                // .orderBy("createdAt", "desc")
                .where("screamId", "==", screamData.screamId)
                .get()
        })
        .then(data => {
            screamData.comments = [];
            data.forEach(commentDoc => screamData.comments.push(commentDoc.data()))
        })
        .then(() => res.json(screamData))
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })

}

exports.commentOnScream = (req, res) => {

    if (isEmpty(req.body.body)) return res.status(403).json({
        error: { body: "Must not be empty" }
    })

    db.doc(`/screams/${req.params.screamId}`).get()
        .then(doc => {
            if (!doc.exists) return res.status(404).json({ error: "Scream not found" })
            return doc.id;
        })
        .then(screamId => ({
            body: req.body.body,
            userHandle: req.user.handle,
            createdAt: new Date().toISOString(),
            userImg: req.user.imageUrl,
            screamId
        }))
        .then(newComment => db.collection("comments").add(newComment))
        .then(() => res.json({ message: `new comment created successfully` }))
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}