const app = require("./app");
require("dotenv").config()
const { connectRedis } = require("./config/redis");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    try {
      await connectRedis();
    } catch (redisErr) {
      console.warn("⚠️  [Server] Redis not available, running in DB fallback mode:", redisErr.message);
    }

    app.listen(PORT, () => {
      console.log(`[Main Server / Gateway] Server running on Port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();

