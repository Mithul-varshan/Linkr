const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "auth-service",
    status: "alive",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.use("/", authRoutes);

app.listen(PORT, () => {
  console.log(`[Auth Service] Running on port ${PORT}`);
});

module.exports = app;
