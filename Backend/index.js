const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Trello Backend API is running.",
    db_status:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    port: PORT,
  });
});

const connectDBAndStartServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`(Access via http://localhost:${PORT})`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

connectDBAndStartServer();
