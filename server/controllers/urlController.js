const generateCode = require("../utils/generateCode");
const urlModel = require("../models/urlModel");
const { redisClient } = require("../config/redis");

const isValidHttpUrl = (value) => {
  if (!/^https?:\/\//i.test(value.trim())) return false;

  try {
    const parsed = new URL(value.trim());
    const hostname = parsed.hostname.toLowerCase();
    const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const hasPublicDomain =
      hostname.includes(".") &&
      !hostname.startsWith(".") &&
      !hostname.endsWith(".");

    return Boolean(
      hostname &&
        (hostname === "localhost" || isIpv4 || hasPublicDomain) &&
        (parsed.protocol === "http:" || parsed.protocol === "https:"),
    );
  } catch {
    return false;
  }
};

const createShortUrl = async (req, res) => {
  try {
    const { original_url, custom_code } = req.body;
    const originalUrl = typeof original_url === "string" ? original_url.trim() : "";

    if (!originalUrl) {
      return res.status(400).json({ message: "URL is required" });
    }

    if (!isValidHttpUrl(originalUrl)) {
      return res.status(400).json({
        message: "Please provide a valid http:// or https:// URL",
      });
    }

    let shortCode = custom_code?.trim() || "";

    // Validate custom code if provided
    if (shortCode) {
      if (shortCode.length < 3 || shortCode.length > 50) {
        return res
          .status(400)
          .json({ message: "Custom code must be 3-50 characters long" });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
        return res.status(400).json({
          message:
            "Custom code can only contain letters, numbers, hyphens, and underscores",
        });
      }

      // Check if code already exists
      const exists = await urlModel.codeExists(shortCode);
      if (exists) {
        return res
          .status(409)
          .json({ message: "This custom code is already taken" });
      }
    } else {
      // Generate random code if no custom code provided
      shortCode = generateCode();
    }

    const userId = req.user?.id || null;
    await urlModel.createShortUrl(originalUrl, shortCode, userId);

    const forwardedProto = req.headers["x-forwarded-proto"];
    const protocol = forwardedProto || req.protocol;
    const host = req.get("host");
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

    res.json({
      short_url: `${baseUrl}/${shortCode}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    const shortCode = decodeURIComponent(code).trim();

    // 1. Check Redis first
    let cachedUrl = null;
    if (redisClient && redisClient.isOpen) {
      try {
        cachedUrl = await redisClient.get(`url:${shortCode}`);
      } catch (err) {
        console.warn("Redis GET error:", err.message);
      }
    }

    if (cachedUrl) {
      console.log("Redis Cache HIT");
      return res.redirect(cachedUrl);
    }

    console.log("Redis Cache MISS (or cache offline)");

    // 2. Redis doesn't have the URL
    // So check MySQL
    const result = await urlModel.getUrlByCode(shortCode);

    if (result.length === 0) {
      return res.status(404).json({
        message: "URL not found",
      });
    }

    const url = result[0];

    if (!url.original_url) {
      return res.status(500).json({
        message: "URL record is missing the destination address",
      });
    }

    // 3. Store URL in Redis
    // Cache for 1 hour
    if (redisClient && redisClient.isOpen) {
      try {
        await redisClient.set(
          `url:${shortCode}`,
          url.original_url,
          {
            EX: 3600,
          }
        );
      } catch (err) {
        console.warn("Redis SET error:", err.message);
      }
    }

    // 4. Increment clicks
    await urlModel.incrementClicks(url.id);

    // 5. Redirect
    return res.redirect(url.original_url);

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};

const getMyLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    const [links, totalClicks] = await Promise.all([
      urlModel.getUrlsByUserId(userId),
      urlModel.getTotalClicksByUserId(userId),
    ]);

    return res.json({ links, totalClicks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getGlobalClickStats = async (_req, res) => {
  try {
    const totalClicks = await urlModel.getTotalClicksOverall();
    return res.json({ totalClicks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getGlobalUrlStats = async (_req, res) => {
  try {
    const totalUrls = await urlModel.getTotalUrlsOverall();
    return res.json({ totalUrls });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const deleteMyLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid link id" });
    }

    const result = await urlModel.deleteUrlByIdAndUserId(id, userId);

    if (result.affectedRows === 0) {
      return res.status(200).json({ message: "link already deleted" });
    }
    return res.json({ message: "link deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createShortUrl,
  redirectUrl,
  getMyLinks,
  getGlobalClickStats,
  getGlobalUrlStats,
  deleteMyLink,
};
