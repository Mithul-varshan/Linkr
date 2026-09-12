const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 2) {
                return false; // Stop retrying
            }
            return 200;
        }
    }
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

redisClient.on("connect", () => {
    console.log("Connecting to Redis...");
});

redisClient.on("ready", () => {
    console.log("Redis connected successfully");
});

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

module.exports = {
    redisClient,
    connectRedis
};