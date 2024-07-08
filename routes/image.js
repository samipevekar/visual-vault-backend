const express = require("express");
const app = express();
const fetchuser = require("../middleware/middleware");
const Images = require("../models/image");
const multer = require("multer");
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const private_key = require("../firebase/privatekey.json");

require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert(private_key),
  storageBucket: 'gs://visual-vault-images.appspot.com',
});

const bucket = admin.storage().bucket();
const upload = multer({ storage: multer.memoryStorage() }).array('post', 4);

app.post("/upload", fetchuser, upload, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const urls = [];
  let uploadPromises = req.files.map(file => {
    const blob = bucket.file(uuidv4() + path.extname(file.originalname));
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        acl: [{ entity: 'allUsers', role: 'READER' }],
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        reject(err);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        urls.push(publicUrl);
        resolve();
      });

      blobStream.end(file.buffer);
    });
  });

  Promise.all(uploadPromises)
    .then(() => {
      res.json({ success: true, image_urls: urls });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
});

app.post("/addimage", fetchuser, async (req, res) => {
  try {
    const images = await Images.find({});
    let id;
    if (images.length > 0) {
      let last_product_array = images.slice(-1);
      let last_product = last_product_array[0];
      id = last_product.id + 1;
    } else {
      id = 1;
    }

    const imageUrls = req.body.image_urls; // array of image URLs
    const favorite = req.body.favorite;

    let savedData = [];
    for (const imageUrl of imageUrls) {
      const data = new Images({
        id: id++,
        image: imageUrl,
        favorite: favorite,
        user: req.user.id
      });
      savedData.push(await data.save());
    }

    res.json({ success: true, message: "Images Added Successfully", savedData });

  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

app.get("/getallimages", fetchuser, async (req, res) => {
  try {
    let data = await Images.find({ user: req.user.id });
    data.reverse();
    if (!data) {
      return res.json({ message: "No image found" });
    }
    res.send(data);

  } catch (error) {
    res.send("Internal server error");
  }
});

app.put("/editimage/:id", fetchuser, async (req, res) => {
  try {
    const { favorite } = req.body;
    const newData = {};
    if (favorite !== undefined) { // Check if favorite is defined
      newData.favorite = favorite;
    }
    // find if there is data or not
    let data = await Images.findById(req.params.id);
    if (!data) {
      res.json({ message: "Image not found" });
    }
    if (data.user && data.user.toString() !== req.user.id) {
      return res.status(404).send("Not allowed");
    }

    data = await Images.findByIdAndUpdate(
      req.params.id,
      { $set: newData },
      { new: true }
    );
    res.json({ success: true, message: "added to favorites", data });

  } catch (error) {
    res.send("Internal server error");
  }
});

app.get("/getfavoriteimage", fetchuser, async (req, res) => {
  try {
    let data = await Images.find({ user: req.user.id, favorite: true });
    data.reverse();
    res.send(data);

  } catch (error) {
    res.send("Internal server error");
  }
});

app.delete("/deleteimage/:id", fetchuser, async (req, res) => {
  try {
    // find if there is image or not
    let data = await Images.findById(req.params.id);
    if (!data) {
      res.json({ message: "Image not found" });
    }

    data = await Images.findByIdAndDelete(req.params.id, { new: true });
    res.json({ message: "Image deleted successfully" });

  } catch (error) {
    res.send("Internal server error");
  }
});

app.get("/searchbydate/:date", fetchuser, async (req, res) => {
  try {
    const userImages = await Images.find({ user: req.user.id });
    if (!userImages || userImages.length === 0) {
      return res.json({ success: false, message: "No images found for the user" });
    }

    const inputDate = new Date(req.params.date);
    if (isNaN(inputDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date format" });
    }

    const nextDay = new Date(inputDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const images = await Images.find({
      user: req.user.id,
      date: {
        $gte: inputDate,
        $lte: nextDay
      }
    });

    if (!images || images.length === 0) {
      return res.json({ success: false, message: "No images found for the specified date" });
    }
    res.json(images);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = app;
