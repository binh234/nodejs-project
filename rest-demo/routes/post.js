const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

router.get("/", async (req, res) => {
    try {
        const posts = await Post.find().limit(20);
        res.send(posts);
    } catch(err) {
        res.status(404).send(err);
    }
})

router.post("/", async (req, res) => {
    const post = new Post({
        title: req.body.title,
        description: req.body.description
    });
    try {
        const savedPost = await post.save();
        res.json(savedPost);
    } catch(err) {
        res.status(404).send(err);
    }
})

router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.json(post);
    } catch (error) {
        res.status(404).send(error);
    }
})

router.put("/:id", async (req, res) => {
    try {
        const post = await Post.updateOne(
            { _id: req.params.id },
            { $set: {
                title: req.body.title,
                description: req.body.description
            }}
        )
        res.json(post);
    } catch (error) {
        res.status(404).send(error);
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const result = await Post.remove({_id: req.params.id});
        res.json(result);
    } catch (error) {
        res.status(404).send(error);
    }
})

module.exports = router