const express = require("express");
const cors = require("cors");
const { createProxyMiddleware, fixRequestBody } = require("http-proxy-middleware");
require("dotenv").config();

const app = express();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5002";

// CORS middleware - must come before routes
const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Auth Service Reverse Proxy (forwards /api/auth and /auth to Auth Service :5002)
const authProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
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

app.use(express.json());

// Render keep-alive health check
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "main-server-gateway",
    status: "alive",
    authServiceUrl: AUTH_SERVICE_URL,
    time: new Date(),
  });
});

const urlRoutes = require("./routes/urlRoutes");
app.use("/", urlRoutes);

module.exports = app;

