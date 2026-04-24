import express from "express";
import Search from "../models/Search.js"; // or any collection you store queries in
import axios from "axios";

const router = express.Router();


router.get("/suggestions", async (req, res) => {
  const q = req.query.q?.trim().toLowerCase();

  if (!q) {
    return res.json([
      "youtube",
      "google translate",
      "weather today",
      "news today",
      "instagram login"
    ]);
  }

  try {
    // 🔹 1. Get from DB (history)
    const dbResults = await Search.find({
      query: { $regex: `^${q}`, $options: "i" }
    }).limit(5);

    const dbSuggestions = dbResults.map(item => item.query);

    // 🔹 2. Default smart suggestions (Google-style)
  // 🔹 2. Google suggestions
let googleSuggestions = [];

try {
  const googleRes = await axios.get(
    "https://suggestqueries.google.com/complete/search",
    {
      params: { client: "firefox", q },
      headers: { "User-Agent": "Mozilla/5.0" }
    }
  );

  googleSuggestions = googleRes.data[1];
} catch (err) {
  console.log("⚠ Google suggestions failed");
}

// 🔹 3. Merge + remove duplicates
let finalSuggestions = [...new Set([
  ...dbSuggestions,
  ...googleSuggestions
])];

// 🔥 fallback if empty
if (finalSuggestions.length === 0) {
  finalSuggestions = [
    q,
    `${q} tutorial`,
    `${q} meaning`,
    `${q} examples`,
    `${q} course`,
    `${q} in hindi`
  ];
}

res.json(finalSuggestions.slice(0, 7));

  }
   catch (err) {
  console.error("❌ GOOGLE ERROR:", err.message);

  const fallback = [
    q,
    `${q} tutorial`,
    `${q} meaning`,
    `${q} examples`,
    `${q} course`,
    `${q} in hindi`
  ];

  res.json(fallback);
}
});

export default router;