import express from "express";
import Groq from "groq-sdk";

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/", async (req, res) => {
  console.log("REQ BODY:", req.body);
  try {
    const { messages } = req.body;

    // 🔥 FIX: prevent crash
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ reply: "Invalid messages format" });
    }
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages,
      temperature: 0.7,
    });

    res.json({
      reply: completion.choices[0]?.message?.content || "",
    });

  } catch (err) {
    console.error("🔥 CHAT ERROR FULL:", err); // 👈 IMPORTANT
    res.status(500).json({ reply: "Chat failed" });
  }
});
export default router;