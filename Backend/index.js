const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./socket');
const authRoutes = require('./Routes/AuthRoutes'); 
const workspaceRoutes = require('./Routes/WorkspaceRoutes');
const boardRoutes = require('./Routes/BoardRoutes');
const listRoutes = require('./Routes/ListRoutes');
const cardRoutes = require('./Routes/CardRoutes');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app); 
const io = initSocket(server); 

io.on('connection', (socket) => {
    console.log(`[Socket.io] User connected: ${socket.id}`);
    socket.on('joinBoard', (boardId) => {
        Object.keys(socket.rooms).forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
            }
        });
        socket.join(boardId);
        console.log(`[Socket.io] User ${socket.id} joined board room: ${boardId}`);
    });
    socket.on('disconnect', () => {
        console.log(`[Socket.io] User disconnected: ${socket.id}`);
    });
});

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Trello Backend API is running.",
    db_status:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    port: PORT,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);

const connectDBAndStartServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected successfully!");

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`(Access via http://localhost:${PORT})`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

connectDBAndStartServer();
