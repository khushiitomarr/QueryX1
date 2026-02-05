import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import Search from "./models/Search.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

connectDB();

/* 🔍 SEARCH + SAVE HISTORY */
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  // save search
  await Search.create({ query });

  // mock results (replace later with real data)
  const results = [
    {
      title: `Result for "${query}"`,
      description: `This is a mock result related to ${query}.`,
      url: "https://example.com",
    },
    {
      title: `${query} tutorial`,
      description: `Learn ${query} step by step with examples.`,
      url: "https://example.com/tutorial",
    },
    {
      title: `${query} documentation`,
      description: `Official documentation for ${query}.`,
      url: "https://example.com/docs",
    },
  ];

  res.json(results);
});

/* 🕘 FETCH SEARCH HISTORY */
app.get("/api/history", async (req, res) => {
  const history = await Search.find()
    .sort({ createdAt: -1 })
    .limit(5);

  res.json(history);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
