import express from "express";
import axios from "axios";

const router = express.Router();

// 🔥 Cache
const suggestCache = {};
const CACHE_TTL = 60 * 1000;

router.get("/", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);

  const lowerQ = q.toLowerCase();

  // ✅ Cache hit
  if (
    suggestCache[lowerQ] &&
    Date.now() - suggestCache[lowerQ].timestamp < CACHE_TTL
  ) {
    return res.json(suggestCache[lowerQ].data);
  }

  try {
    // 🔥 FREE GOOGLE API
    const response = await axios.get(
      "https://suggestqueries.google.com/complete/search",
      {
        params: {
          client: "firefox",
          q
        }
      }
    );

    const suggestions = response.data[1] || [];

    const topSeven = suggestions.slice(0, 7);

    // cache store
    suggestCache[lowerQ] = {
      data: topSeven,
      timestamp: Date.now()
    };

    res.json(topSeven);

  } catch (err) {
    console.log("Suggest error:", err.message);
    res.json([]);
  }
});

export default router;