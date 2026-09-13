const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Not authorized, invalid token payload" });
    }

    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
    const decoded = jwt.verify(token, secret);

    if (decoded && decoded.id) {
      req.user = { id: decoded.id };
    }

    next();
  } catch (err) {
    // For optional auth, if invalid token is sent, treat as unauthenticated
    return next();
  }
};

module.exports = { protect, optionalProtect };