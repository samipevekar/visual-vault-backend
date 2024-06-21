const express = require("express");
const app = express();
const fetchuser = require("../middleware/middleware");
const Images = require("../models/image");
const multer = require("multer");
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const serviceAccount = {
    "type": "service_account",
    "project_id": "visual-vault-images",
    "private_key_id": "9111b8fe68e499eb5aa0aaada41231d24ca664b3",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC38zZOBEMqGq5u\nr/AUC/XKDwZXa5tAf7+5iQmLomr8g1Z6vYOjkKBzwcix+AubvtVIs888Rk2jcpq7\nLLGu90V4jFI//U4zaCZG2zHP19XdsCkn0X48UzJvEFjEs3eX/rnnw7/Fm+ZhyOpP\nyf364Nt0fBGM04ewfJTrovbUjG3GWxTUi3cnTL93A8F8QVBvlmc4V+qJNmRt2AGR\n+04Vxjluy4BVKrJz7xOFa8JWZ5+A2Iub39e5eyIHYB76agHXlyXkDw7Q205yS8Nm\nDDmgruzwlfzJjvTvdSTGpiIdocpt1PbuQtXBCE80bgn7ETlMuEvvyjNOcUJQ1YcV\naS/FrnM9AgMBAAECggEAJDe7N/Yn4Tjaokl6u/+016FIrtqteTAN6DJekkMazHfx\nhX4d1o0JwnDjmoLLilEy/jsE8QmojKdqZrMAkwH1iCwcn6O4i2+UpbvPnWwSHDFs\nkP3y3F7HHc36pFPvlpodMVA9yGMPI66iz63mF0jBfLhW3kLhwvJsgc6WybeSf4ym\nt5JJT7TCf0pTSpeajdA8/fMOsNtcCsI68i7OFCd0me7uVoKkVOB0uqgfAVy6+PmB\nCw5cxjSOWecGNi9yRjzor5BjipG/63pb5mCuLAwO1/BfYpa+hr/LU2vRbrDbnUeZ\noObV4fx6QGEwJaFk4IBqP4stidrBpJdjxlEjDpaQkQKBgQDnQC1KGAg5WzuNx2sO\nyQJYGWVoFGX16S8GuON4PQIZ4bDbRCOGW1dM1eGWcoN3dXEYXHpDUIeagRfmbEAp\nc9LYGv4ZL0dDSD+ASgcqbXicSvfeFODxZEmWIFv/Za07PZ03kgqn8fAiTMtRUJAj\nyNuYKyMtqqMV6/j52easWpHV+QKBgQDLoxa54ZDXukESr1+LHkjZ4K4Hz0qlQNVE\nhiYVuyKQgpGRWN4Wbk3XgebZTGGx04vV6yjp5bnLi5yL+gIeCGv4Ok8f7hLth4Gx\n7buAzo+5aO8bzM/gsg8s2yOt89rrqGvoVr6TluvjhWQoHlOuV2ffNS8ZniAZ219i\n7i1I929IZQKBgFu20D96mIhm7o+kb4lFn3BhYh6NOIL3IHeCDHU7fQHWyNWtiIlY\n4J7QlM+eSxWttlT7GGJqJd3ZJSl19Vx7WzvqOKy0W4cLuGOg+IaTNCqIcRXbIfua\n0rR/0PzRzoqYPSo0+ZTyF1MDMf/l+8S1fKI1OZZ6/oNLO0ucaCgjI4PBAoGAZeg2\n7kzorFzkRdKH0NoWARsEXJorM+nvEHzFwGhHEuSUrpU3hygqQmgau7ISzegc+a/W\naL7zLN6wOAikWJ1EUxPzFvqQdFg02nMrO3mjyVivGE111m+lUoBUKbB4ZSiC3+HR\nO5DyeYj+p2kN3ZiWPciiyoIsdGQpJxwkg3h4M1UCgYEAj2lJbXI9TxvgnhJ/ULZa\nO0ElTCio/9LCJW/Z8gOa8VMVDLLYSKtK8343iVXm4jlYs9GEuy6A9sUtZOvHBbbs\nl1THqyNT8DTS/+V8RHKXwUEKe02VcKM0s2SnwS6UrjnZcBRSNus9Y4qYd6wiwG+D\n4ChkVzDeU8ubNAQdlB2/mb4=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-2nfxq@visual-vault-images.iam.gserviceaccount.com",
    "client_id": "110840455385014358594",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-2nfxq%40visual-vault-images.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
}
  

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://visual-vault-images.appspot.com',
});

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
