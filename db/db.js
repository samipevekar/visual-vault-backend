const mongoose = require("mongoose");

const connectMongo = () => {
    const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 45000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    mongoose.connect('mongodb+srv://samipevekar:visualvault7901@cluster0.ejkvgmn.mongodb.net/Practice', options)
        .then(() => console.log("Connected to MongoDB Atlas"))
        .catch((err) => console.log("Error connecting to MongoDB Atlas:", err));
}

module.exports = connectMongo;
