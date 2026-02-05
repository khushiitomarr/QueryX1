import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.get("/", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json({ results: [] });

  try {
    const r = await axios.get(
      `https://serpapi.com/search.json?q=${q}&api_key=${process.env.SERP_API_KEY}`
    );

    const organic = r.data.organic_results || [];

    const results = organic.map((obj) => ({
      title: obj.title,
      description: obj.snippet,
      url: obj.link
    }));

    res.json({ results });

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    res.json({ results: [] });
  }
});

export default router;
