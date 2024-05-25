const mongoose = require("mongoose")
// mongodb+srv://samipevekar:visualvault7901@cluster0.ejkvgmn.mongodb.net - atlas url
// mongodb://127.0.0.1:27017  - localhost url
const connectMongo=()=>{
    mongoose.connect(`mongodb+srv://samipevekar:visualvault7901@cluster0.ejkvgmn.mongodb.net/Practice`)
    .then(()=>console.log("connected"))    
    .catch((err)=>console.log(err))

}

module.exports = connectMongo