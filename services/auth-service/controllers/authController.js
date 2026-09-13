const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const createToken = (id) => {
  const secret = process.env.JWT_SECRET || "fallback_secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id }, secret, { expiresIn });
};

const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await userModel.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await userModel.createUser(normalizedEmail, hashedPassword);
    const token = createToken(userId);

    return res.status(201).json({
      message: "Signup successful",
      user: { id: userId, email: normalizedEmail },
      token,
    });
  } catch (err) {
    return res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await userModel.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user.id);

    return res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
};

const getMe = async (req, res) => {
  return res.json({
    user: req.user,
  });
};

const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ valid: false, message: "Token missing" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "fallback_secret";
    const decoded = jwt.verify(token, secret);

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ valid: false, message: "User not found" });
    }

    return res.json({ valid: true, user });
  } catch (err) {
    return res.status(401).json({ valid: false, message: "Invalid token", error: err.message });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  verifyToken,
};
