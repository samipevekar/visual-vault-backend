const http = require("http");
const express = require("express");
const path = require("path");
const app = express();

const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["https://visual-vault-app.vercel.app", "http://localhost:5173", "*", "https://visual-vault.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  path: '/socket',
});

const userSocketMap = {}; // Maps userId to socketId

// Function to get the socket ID of a receiver using their userId
const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Extract the userId from the query parameters
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id; // Map the userId to the socketId
    console.log(`User ${userId} mapped to socket ${socket.id}`);
  }

  // Emit the list of online users to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);

    // Remove the user from the socket map if they are disconnecting
    if (userId && userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
      console.log(`User ${userId} removed from socket map`);
    }

    // Emit the updated list of online users to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

module.exports = { app, io, server, getReceiverSocketId };
