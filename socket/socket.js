const http = require("http");
const express = require("express");
const path = require("path");
const Message = require("../models/messagemodel");
const app = express();

const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: [
      "https://visual-vault-app.vercel.app",
      "http://localhost:5173",
      "*",
      "https://visual-vault.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const userSocketMap = {}; // Maps userId to socketId

// Function to get the socket ID of a receiver using their userId
const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} mapped to socket ${socket.id}`);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    if (userId && userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
      console.log(`User ${userId} removed from socket map`);
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // Listen for messageSeen event
  socket.on("messageSeen", async ({ messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        if (!message.seenBy.includes(userId)) {
          message.seenBy.push(userId);
          await message.save();

          // Notify all clients about the message being seen
          io.emit("messageSeen", { messageId, userId });
        }
      }
    } catch (error) {
      console.error("Error in messageSeen event:", error.message);
    }
  });
});

module.exports = { app, io, server, getReceiverSocketId };
