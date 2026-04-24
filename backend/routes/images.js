import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  const q = req.query.q;

  try {
    const r = await axios.get(
      `https://serpapi.com/search.json?q=${q}&tbm=isch&api_key=${process.env.SERP_API_KEY}`
    );

    const images = r.data.images_results || [];

    const results = images.map((img) => ({
      url: img.original,
      thumbnail: img.thumbnail,
      title: img.title
    }));

   res.json({ images: results });

  } catch (err) {
    console.error(err);
    res.json({ results: [] });
  }
});

export default router;