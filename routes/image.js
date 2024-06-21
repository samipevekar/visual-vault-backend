require('dotenv').config();
const express = require("express");
const app = express();
const fetchuser = require("../middleware/middleware");
const Images = require("../models/image");
const multer = require("multer");
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert({
      type: process.env.GOOGLE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
    }),
    storageBucket: 'gs://visual-vault-images.appspot.com',
  });

  // 

const bucket = admin.storage().bucket();
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint for image upload
app.post("/upload", fetchuser, upload.single('post'), (req, res) => {
    const blob = bucket.file(uuidv4() + path.extname(req.file.originalname));
    const blobStream = blob.createWriteStream({
      metadata: {
          contentType: req.file.mimetype,
          // Setting the acl property to public-read
          acl: [{
            entity: 'allUsers',
            role: 'READER'
          }]
      },
    });
  
    blobStream.on('error', (err) => {
      res.status(500).json({ error: err.message });
    });
  
    blobStream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      res.json({ success: true, image_url: publicUrl });
    });
  
    blobStream.end(req.file.buffer);
  });
  
// Endpoint for saving images in the database
app.post("/addimage", fetchuser, async (req, res) => {
  try {
    const image = await Images.find({});
    let id;
    if (image.length > 0) {
      let last_product_array = image.slice(-1);
      let last_product = last_product_array[0];
      id = last_product.id + 1;
    } else {
      id = 1;
    }

    const data = new Images({
      id: id,
      image: req.body.image,
      favorite: req.body.favorite,
      user: req.user.id
    });
    const savedData = await data.save();
    res.json({ success: true, message: "Image Added Successfully", savedData });

  } catch (error) {
    res.status(500).send("internal server error");
  }
});

// Endpoint for getting all images
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

// Endpoint to edit favorite images
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

// Endpoint to get favorite images
app.get("/getfavoriteimage", fetchuser, async (req, res) => {
    try {
        let data = await Images.find({ user: req.user.id, favorite: true });
        data.reverse();
        res.send(data);

    } catch (error) {
        res.send("Internal server error");
    }
});

// Endpoint to delete image
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

// Serach image by date 
app.get("/searchbydate/:date", fetchuser, async (req, res) => {
    try {
        const userImages = await Images.find({ user: req.user.id });
        if (!userImages || userImages.length === 0) {
            return res.json({success:false, message: "No images found for the user" });
        }
        
        const inputDate = new Date(req.params.date);
        if (isNaN(inputDate.getTime())) {
            // If the input date is not a valid date, return an error response
            return res.status(400).json({success:false, message: "Invalid date format" });
        }
        
        const nextDay = new Date(inputDate);
        nextDay.setDate(nextDay.getDate() + 1); // Get next day to include the entire input date

        const images = await Images.find({
            user: req.user.id,
            date: {
                $gte: inputDate,
                $lte: nextDay
            }
        });
        
        if (!images || images.length === 0) {
            return res.json({success:false, message: "No images found for the specified date" });
        }        
        res.json(images);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = app;
