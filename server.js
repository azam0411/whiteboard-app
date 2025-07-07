const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { timeStamp } = require("console");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*", // You can restrict this to your frontend origin
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // Track sockets in each room

io.on("connection", (socket) => {
  console.log("🟢 New client connected");

  // Handle joining a room with a name
  socket.on("join-room", ({ roomId, name }) => {
    socket.join(roomId);
    socket.data.name = name || "Anonymous";

    // Add socket to room tracking
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(socket);

    // Broadcast updated user list
    const usersInRoom = rooms[roomId].map((s) => s.data.name);
    io.to(roomId).emit("update-users", usersInRoom);

    // Handle drawing sync
    socket.on("draw", (data) => {
      socket.to(roomId).emit("draw", data);
    });

    // Handle clear event
    socket.on("clear", () => {
      socket.to(roomId).emit("clear");
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((s) => s !== socket);
        const updatedUsers = rooms[roomId].map((s) => s.data.name);
        io.to(roomId).emit("update-users", updatedUsers);
      }
    });
    socket.on("chat-message", (message) => {
      io.to(roomId).emit("chat-message", {
        name: socket.data.name,
        message: message,
        timeStamp: new Date().toISOString(),
      });
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
