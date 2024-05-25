const mongoose = require("mongoose")

const messageSchema = mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    },
    message:{
        type:String,
        required:true
    }

},{timestamps:true})


const Message = mongoose.model("Message",messageSchema)

module.exports = Message