const express = require("express");
const mongoose = require("mongoose");
require("dotenv/config")

const app = express();
app.use(express.json());

// Import routes
const postRoute = require("./routes/post");
app.use("/posts", postRoute);

// ROUTES
app.get("/", (req, res) => {
    res.send("We are on home");
})

// Connect to DB
mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
    console.log("connect to DB");
})

const port = process.env.PORT || 3000;
app.listen(port);
console.log(`Listening on port ${port}...`)