const express = require("express");
const app = express();
const middleware = require("../middleware/middleware");
const Conversation = require("../models/conversationmodel");
const Message = require("../models/messagemodel");
const { getReceiverSocketId, io } = require("../socket/socket");
const User = require("../models/user");

// Endpoint to send messages
app.post("/send/:id", middleware, async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    // This will run in parallel
    await Promise.all([conversation.save(), newMessage.save()]);

    // Socket code here
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
    }).populate({
      path: "messages",
      match: { deletedBy: { $ne: senderId } } // Exclude messages deleted by the sender
    });

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.messages;
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Endpoint to delete messages
app.delete("/deletemessages/:id", middleware, async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "No data found" });
    }

    await Message.findByIdAndDelete(messageId);

    // Remove the message reference from the conversation
    await Conversation.updateOne(
      { messages: messageId },
      { $pull: { messages: messageId } }
    );

    // Emit deleteMessage event
    io.emit("deleteMessage", messageId);

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to delete messages for the current user
app.delete("/deleteforuser/:id", middleware, async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "No data found" });
    }

    if (!message.deletedBy.includes(userId)) {
      message.deletedBy.push(userId);
      await message.save();
    }

    res.json({ message: "Message deleted for user" });
  } catch (error) {
    console.log("Error in deleteMessageForUser controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = app;





















