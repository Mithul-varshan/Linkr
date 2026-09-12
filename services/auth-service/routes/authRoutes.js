const express = require("express");
const { signup, login, getMe, verifyToken } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/verify", verifyToken);

// Also alias /api/auth/* and /auth/* in case the proxy preserves full path
router.post("/api/auth/signup", signup);
router.post("/api/auth/login", login);
router.get("/api/auth/me", protect, getMe);
router.post("/api/auth/verify", verifyToken);

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.get("/auth/me", protect, getMe);
router.post("/auth/verify", verifyToken);

module.exports = router;
