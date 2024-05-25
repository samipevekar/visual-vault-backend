const express = require("express")
const app = express()
const middleware = require("../middleware/middleware")
const Conversation = require("../models/conversationmodel")
const Message = require("../models/messagemodel")
const {getReceiverSocketId,io} = require("../socket/socket")

// Endpoint to send messages
app.post("/send/:id",middleware,async(req,res)=>{
    try {
        const {message} = req.body;
        const {id:receiverId} = req.params;
        const senderId = req.user.id

        let conversation = await Conversation.findOne({
            participants:{$all:[senderId,receiverId]}
        })

        if(!conversation){
            conversation = await Conversation.create({
                participants:[senderId,receiverId]
            })
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message
        })

        if(newMessage){
            conversation.messages.push(newMessage._id)
        }
        
        // await conversation.save()
        // await newMessage.save()

        // This will run in parellel
        await Promise.all([conversation.save(), newMessage.save()])

        // Socket code here
        const receiverSocketId = getReceiverSocketId(receiverId)
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }
        
        res.status(201).json(newMessage)

    } catch (error) {
        console.log("Error in sendMessage controller : ",error.message)
        res.status(500).json({error:"Internal server error"})
    }

}) 

// Endpoint to get messages
app.get("/:id", middleware, async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user.id;

        // Find conversation where both senderId and userToChatId are participants
        const conversation = await Conversation.findOne({
            $and: [
                { participants: senderId },
                { participants: userToChatId }
            ]
        }).populate("messages");

        if (!conversation) return res.status(200).json([]);

        const messages = conversation.messages;
        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});



module.exports = app