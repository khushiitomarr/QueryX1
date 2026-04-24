import express from "express";
import axios from "axios";

const router = express.Router();

const getYouTubeThumbnail = (link, fallback) => {
  if (!link) return fallback;

  let id = null;

  if (link.includes("youtube.com/watch")) {
    id = link.split("v=")[1]?.split("&")[0];
  } else if (link.includes("youtu.be/")) {
    id = link.split("youtu.be/")[1];
  }

  if (!id) return fallback;

  // Use HIGH quality (more stable than maxres)
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};

router.get("/", async (req, res) => {
  const q = req.query.q;
  
  try {
    const r = await axios.get(
      `https://serpapi.com/search.json?q=${q}&tbm=vid&api_key=${process.env.SERP_API_KEY}`
    );
    
    const videos = r.data.video_results || [];
    console.log(videos[0]);
    
    const results = videos
  .filter(v => v.link)
  .map((vid) => ({
    title: vid.title,
    link: vid.link,
    thumbnail: getYouTubeThumbnail(vid.link, vid.thumbnail),
    channel: vid.source || "YouTube"
  }));
  res.json({ videos: results });
  
} catch (err) {
  console.error(err);
  res.json({ videos: [] });
}
});

export default router;