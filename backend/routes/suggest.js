import express from "express";
import Search from "../models/Search.js"; // or any collection you store queries in

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    // 🔎 SIMPLE regex-based suggestion
    const results = await Search.find({
      query: { $regex: q, $options: "i" },
    })
      .limit(6)
      .select("query -_id");

    res.json({
      suggestions: results.map((r) => r.query),
    });

  } catch (err) {
    console.error("SUGGEST ERROR:", err);
    res.status(500).json({ suggestions: [] });
  }
});

export default router;
