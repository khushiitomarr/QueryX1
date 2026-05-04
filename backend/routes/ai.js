import express from "express";
import Groq from "groq-sdk";

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const fallbackQuiz = [
  {
    question: "2 + 2 = ?",
    options: ["3", "4", "5", "6"],
    answer: 1,
    correctAnswer: "4",
    explanation: "2 + 2 equals 4.",
  },
];

const getAnswerIndex = ({ answer, correctAnswer, options }) => {
  if (typeof answer === "number" && answer >= 0 && answer <= 3) {
    return answer;
  }

  const answerText = String(correctAnswer || answer || "").trim();
  if (!answerText) return -1;

  const letterMatch = answerText.match(/^([A-D])(?:[\).:-]|\s|$)/i);
  if (letterMatch) {
    return letterMatch[1].toUpperCase().charCodeAt(0) - 65;
  }

  return options.findIndex(
    (option) => option.trim().toLowerCase() === answerText.toLowerCase()
  );
};

const normalizeQuizQuestion = (q) => {
  const options = Array.isArray(q?.options)
    ? q.options.map((option) => String(option)).slice(0, 4)
    : [];

  while (options.length < 4) {
    options.push(`Option ${options.length + 1}`);
  }

  const correctAnswer =
    q?.correctAnswer === undefined || q?.correctAnswer === null
      ? ""
      : String(q.correctAnswer);

  const answerIndex = getAnswerIndex({
    answer: q?.answer,
    correctAnswer,
    options,
  });

  const answer = answerIndex >= 0 ? answerIndex : 0;

  return {
    question: q?.question || "Question",
    options,
    answer,
    correctAnswer: options[answer],
    explanation: q?.explanation || "",
  };
};

router.post("/", async (req, res) => {
  try {
    const { query, mode } = req.body;
    if (!query) return res.json({ answer: "" });

    let content = "";

    // EXAM MODE
    if (mode === "exam") {
      const prompt = `
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

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Use clean markdown.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 600,
      });

      content = completion.choices[0]?.message?.content || "";
      return res.json({ answer: content });
    }

    // QUIZ MODE
    if (mode === "quiz") {
      const gen = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You MUST return strictly valid JSON.

Format:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "correctAnswer": "exact option text",
      "explanation": "string"
    }
  ]
}

Rules:
- Exactly 3 questions
- Exactly 4 options per question
- Only ONE correct answer per question
- "answer" must be the 0-based index of the correct option
- "correctAnswer" must exactly match the correct option text
- Make sure the answer index and correctAnswer are consistent
- No markdown
- No text outside JSON
            `,
          },
          {
            role: "user",
            content: `Generate 3 MCQs about "${query}".`,
          },
        ],
        temperature: 0,
        max_tokens: 700,
      });

      const raw = gen.choices[0]?.message?.content || "";

      try {
        const parsed = JSON.parse(raw);
        const safe = (parsed.questions || [])
          .slice(0, 3)
          .map(normalizeQuizQuestion);

        return res.json({
          answer: JSON.stringify(safe.length ? safe : fallbackQuiz),
        });
      } catch (err) {
        console.log("JSON failed, using quiz fallback");

        return res.json({
          answer: JSON.stringify(fallbackQuiz),
        });
      }
    }

    // NORMAL MODE
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Use clean markdown.",
        },
        { role: "user", content: query },
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    content = completion.choices[0]?.message?.content || "";

    res.json({ answer: content });
  } catch (err) {
    console.error("AI ERROR FULL:", err);

    res.status(500).json({
      answer: "AI failed",
      error: err.message,
    });
  }
});

export default router;
