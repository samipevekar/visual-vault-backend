const mongoose = require("mongoose")

const conversationSchema = mongoose.Schema(
    {
    participants:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"users"
        }
    ],
    messages:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Message",
            default:[]
        }
    ]
},{timestamps:true}
)

const Conversation = mongoose.model("Conversation",conversationSchema)

module.exports = Conversation