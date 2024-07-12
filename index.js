const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectMongo = require("./db/db");
const { app, server } = require("./socket/socket");
const compression = require('compression');


const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: ["https://visual-vault-app.vercel.app", "http://localhost:5173", "https://visual-vault.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(compression());
app.use(express.json());
app.use(cookieParser());

connectMongo();

// Available routes
app.get("/", (req, res) => {
  res.send("sami is here");
});

app.get("/about", (req, res) => {
  res.send("this is about");
});

app.use("/api/auth", require("./routes/user"));
app.use("/api/image", require("./routes/image")); // Include the image routes

app.use("/api/messages", require("./routes/messageroute"));

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
