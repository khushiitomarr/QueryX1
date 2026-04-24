import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import Search from "../models/Search.js";
import mongoose from "mongoose";

dotenv.config();
const router = express.Router();

/* =============================
🔍 SEARCH + SAVE HISTORY
============================= */
router.get("/", async (req, res) => {
  try {
    
    const q = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const start = (page - 1) * 10;
  const userId = req.user?.id;

  if (!q) return res.json({ results: [] });

  if (userId) {
  await Search.create({
    userId: userId,
    query: q.trim().toLowerCase()
  });
}

    const r = await axios.get(
      `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&start=${start}&api_key=${process.env.SERP_API_KEY}`
    );

    const organic = r.data.organic_results || [];

    let results = organic.map((obj) => ({
      title: obj.title,
      description: obj.snippet,
      url: obj.link
    }));

    if (results.length === 0) {
      results = [{
        title: `Search result for "${q}"`,
        description: `No direct results found.`,
        url: `https://www.google.com/search?q=${encodeURIComponent(q)}`
      }];
    }

    res.json({ results });
  } catch (err) {
    console.error("Search Error:", err.message);
    res.json({ results: [] });
  } 
});

/* =============================
📜 GET HISTORY
============================= */
router.get("/history", async (req, res) => {
  try {
const userId = req.user?.id;

if (!userId) return res.json([]); // 🔥 no history for guest

const history = await Search.aggregate([
  { $match: { userId } },
  { $sort: { createdAt: -1 } },
  {
    $group: {
      _id: "$query",
      doc: { $first: "$$ROOT" }
    }
  },
  { $replaceRoot: { newRoot: "$doc" } },
  { $limit: 10 }
]);

    res.json(history);
  } catch (err) {
    console.error("History Error:", err);
    res.status(500).json([]);
  }
});

/* =============================
🗑 CLEAR HISTORY
============================= */
router.delete("/history", async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
  return res.status(401).json({ message: "Login required" });
}

await Search.deleteMany({ userId });// ✅ FIXED

    res.json({ message: "Cleared" });
  } catch (err) {
    console.error("Failed to clear history", err);
    res.status(500).json({ message: "Error" });
  }
});

export default router;