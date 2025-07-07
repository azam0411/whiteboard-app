const express = require("express");
const http = require("http");
const { Socket } = require("socket.io");
const { Server } = require("socket.io");
const path = require("path");
const { log } = require("console");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/room/:roomId", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  socket.on("draw", (data) => {
    const roomId = socket.data.roomId;
    if (roomId) {
      socket.to(roomId).emit("draw", data);
    }
  });

  socket.on("clear", () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      socket.to(roomId).emit("clear");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
