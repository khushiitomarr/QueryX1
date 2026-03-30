import express from "express";
import Groq from "groq-sdk";

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.json({ answer: "" });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      messages: [
       {
  role: "system",
  content: `
You are a professional search AI assistant.

STRICT OUTPUT RULES (MUST FOLLOW):

1. Always format the answer in proper Markdown.
2. Use "##" for main headings.
3. Use "###" for subheadings.
4. Add a blank line after every heading.
5. Use bullet points with "-" only.
6. Each bullet point must be on a new line.
7. Never write headings and paragraph text on the same line.
8. Never return plain text without markdown.

Example format:

## Topic Overview

Short introduction paragraph.

### Key Features

- Feature one
- Feature two
- Feature three

### Applications

- Use case one
- Use case two

Now respond strictly following these rules.
`,
},
        {
  role: "user",
  content: `Provide a well-structured markdown explanation about: ${query}`
},
      ],

      temperature: 0.5,
      max_tokens: 400,
    });

    res.json({
      answer: completion.choices[0]?.message?.content || "",
    });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ answer: "" });
  }
});

export default router;
