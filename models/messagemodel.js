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
    },
    deletedBy: [{ // Array of user IDs who have deleted this message
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }]

},{timestamps:true})


const Message = mongoose.model("Message",messageSchema)

module.exports = Message