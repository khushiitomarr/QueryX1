import express from "express";
import Groq from "groq-sdk";

const router = express.Router();
console.log("GROQ KEY:", process.env.GROQ_API_KEY);
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { query, mode } = req.body;
    if (!query) return res.json({ answer: "" });

   let prompt = "";

if (mode === "exam") {
  prompt = `
Explain "${query}" for a student.

## Key Points
- ...

## Definition
- ...

## Important Questions
- ...

## Quick Revision
- ...
`;
}
else if (mode === "quiz") {
  prompt = `
Create 3 MCQs for "${query}".

STRICT FORMAT:

### Question 1
...

### Question 2
...

### Question 3
...
`;
}
else {
  // 🔥 VERY IMPORTANT FIX
  prompt = query;
}

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "system",
          content: `
You are a helpful search assistant.

IMPORTANT FORMATTING RULES:
- Use VALID Markdown
- Always add a blank line after headings
- Use bullet points with "-" only
- Use short paragraphs
- Do NOT write everything in one line
- Do NOT repeat headings in the same line

Format example:

## Title

Short paragraph.

### Key Points
- Point one
- Point two
- Point three
`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.5,
      max_tokens: 400,
    });

    res.json({
      answer: completion.choices[0]?.message?.content || "",
    });

  } catch (err) {
  console.error("🔥 AI ERROR FULL:", err);

  res.status(500).json({
    answer: "AI failed",
    error: err.message
  });
}
});

export default router;