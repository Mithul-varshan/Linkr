const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS middleware - must come before routes
const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// If an external AUTH_SERVICE_URL is explicitly set in env, proxy to it.
// Otherwise, handle authentication directly with built-in auth routes.
if (process.env.AUTH_SERVICE_URL) {
  const { createProxyMiddleware, fixRequestBody } = require("http-proxy-middleware");
  const authProxy = createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
      error: (err, req, res) => {
        console.error("[Gateway Proxy] Error forwarding to Auth Service:", err.message);
        res.status(503).json({
          message: "Auth service is temporarily unavailable. Please try again later.",
        });
      },
    },
  });

  app.use("/api/auth", authProxy);
  app.use("/auth", authProxy);
} else {
  const authRoutes = require("./routes/authRoutes");
  app.use("/api/auth", authRoutes);
  app.use("/auth", authRoutes);
}

// Render keep-alive health check
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "main-server",
    status: "alive",
    authMode: process.env.AUTH_SERVICE_URL ? "proxy" : "internal",
    authServiceUrl: process.env.AUTH_SERVICE_URL || "internal",
    time: new Date(),
  });
});

const urlRoutes = require("./routes/urlRoutes");
app.use("/", urlRoutes);

module.exports = app;

