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

    if (isEmpty(req.body.body)) return res.status(400).json({
        error: { body: "Must not be empty" }
    })

    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImg: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    }

    db.collection("screams").add(newScream)
        .then(doc => {
            const resScream = newScream;
            resScream.screamId = doc.id;
            return res.json(resScream);
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
                .orderBy("createdAt", "desc")
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

    if (isEmpty(req.body.body)) return res.status(400).json({
        error: { body: "Must not be empty" }
    })

    const newComment = {
        body: req.body.body,
        handle: req.user.handle,
        createdAt: new Date().toISOString(),
        userImg: req.user.imageUrl,
        screamId: req.params.screamId
    }

    db.doc(`/screams/${req.params.screamId}`).get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: "Scream not found" })
            } else {
                return doc.ref.update({ commentCount: ++doc.data().commentCount })
            }
        })
        .then(() => db.collection("comments").add(newComment))
        .then(() => res.json({ message: `New comment created successfully` }))
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

exports.unlikeScream = (req, res) => {

    const like = db.collection("likes")
        .where("screamId", "==", req.params.screamId)
        .where("handle", "==", req.user.handle)
        .limit(1)

    const scream = db.doc(`/screams/${req.params.screamId}`);
    let screamData;

    scream.get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: "Scream not found" })
            } else {
                screamData = doc.data()
                like.get().then(data => {
                    if (data.empty) {
                            return res.status(403).json({ error: "You did not like this scream" })
                    } else {
                        db.doc(`/likes/${data.docs[0].id}`).delete()
                            .then(() => scream.update({ likeCount:  --screamData.likeCount}))
                            .then(() => res.json(screamData))
                    }
                })
            }
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })

}

exports.likeScream = (req, res) => {

    const like = db.collection("likes")
                .where("screamId", "==", req.params.screamId)
                .where("handle", "==", req.user.handle)
                .limit(1)

    const scream = db.doc(`/screams/${req.params.screamId}`);
    let screamData;

    scream.get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: "Scream not found" })
            } else {
                screamData = doc.data()
                like.get()
                    .then(data => {
                        if (!data.empty) {
                            return res.status(403).json({ error: "Scream already liked" })
                        } else {
                            db.collection("likes").add({
                                screamId: req.params.screamId,
                                handle: req.user.handle
                            })
                            .then(() => scream.update({ likeCount: ++screamData.likeCount }))
                            .then(() => res.json(screamData))
                        }
                    })

            }
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

exports.deleteScream = (req, res) => {

    const scream = db.doc(`/screams/${req.params.screamId}`);
    scream.get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: "Scream not found" })
            }

            if (doc.data().userHandle !== req.user.handle) {
                return res.status(403).json({ error: "Unauthorized" })
            }

            deleteEntities(req.params.screamId)
                .then(() => {
                    doc.ref.delete()
                        .then(() => res.json({ message: "Scream successfully deleted" }))
                        .catch(err => {
                            console.error(err);
                            return res.status(500).json({ error: err.code });
                        })
                })
        })
}

const deleteEntities = (screamId) => {

    const entities = ["likes", "comments"];
    let id = screamId;
    let idx = 0;

    const f = (cb) => {
        if (idx < entities.length) {
            return deleteAssociatedEntities(id, entities[idx])
                .then(() => idx++)
                .then(() => cb(cb));
        } else idx = 0
    }

    return f(f)
}

const deleteAssociatedEntities = (id, entityName) => (
    db.collection(entityName)
        .where("screamId", "==", id)
        .get()
        .then(comments => comments.forEach(comment => comment.ref.delete()))
)