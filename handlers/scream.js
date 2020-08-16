const { db } = require("../utils/admin");

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
        .catch(err => console.error(err))
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
            return res.status(500).json({ error: `something went wrong` });
        })
}