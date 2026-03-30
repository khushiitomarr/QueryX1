import express from "express";
import axios from "axios";
import SearchHistory from "../models/SearchHistory.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const detectIntent = (q) => {
  q = q.toLowerCase();
  if (q.includes("learn")) return "learning";
  if (q.includes("buy")) return "shopping";
  if (q.includes("how")) return "guide";
  return "general";
};

// SEARCH
router.get("/", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json({ results: [] });

  const response = await axios.get("https://serpapi.com/search.json", {
    params: {
      q,
      api_key: process.env.SERP_API_KEY
    }
  });

  const results = (response.data.organic_results || []).map(r => ({
    title: r.title,
    description: r.snippet,
    url: r.link
  }));

  res.json({ results, intent: detectIntent(q) });
});

// SAVE HISTORY
router.post("/save", auth, async (req, res) => {
  const { query } = req.body;

  await SearchHistory.findOneAndUpdate(
    { user: req.userId, query },
    { user: req.userId, query },
    { upsert: true }
  );

  res.json({ success: true });
});

// GET HISTORY
router.get("/history", auth, async (req, res) => {
  const data = await SearchHistory.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(data);
});

// CLEAR HISTORY
router.delete("/history", auth, async (req, res) => {
  await SearchHistory.deleteMany({ user: req.userId });
  res.json({ message: "Cleared" });
});

export default router;