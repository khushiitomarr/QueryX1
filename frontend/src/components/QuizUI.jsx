import { useState, useEffect } from "react";
import QuizCard from "./QuizCard";

const FALLBACK_OPTIONS = ["A", "B", "C", "D"];

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

const normalizeQuestion = (q) => {
  const options = Array.isArray(q?.options)
    ? q.options.map((option) => String(option).trim()).filter(Boolean).slice(0, 4)
    : [];

  while (options.length < 4) {
    options.push(FALLBACK_OPTIONS[options.length]);
  }

  const answer = getAnswerIndex({
    answer: q?.answer,
    correctAnswer: q?.correctAnswer,
    options,
  });

  return {
    question: q?.question || "Question",
    options,
    answer,
    correctAnswer: answer >= 0 ? options[answer] : q?.correctAnswer || "",
    explanation: q?.explanation || "",
  };
};

const parseJsonQuiz = (value) => {
  const parsed = JSON.parse(value);
  const list = Array.isArray(parsed) ? parsed : parsed.questions || [];

  return list.map(normalizeQuestion).filter((q) => q.question && q.options.length);
};

const parseMarkdownQuiz = (value) => {
  const text = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const sections = text
    .split(/\n(?=#{1,6}\s*Question\s*\d+|Question\s*\d+)/i)
    .map((section) => section.trim())
    .filter(Boolean);

  return sections
    .map((section) => {
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const questionLines = [];
      const optionsByIndex = [];
      let answer = "";
      let explanation = "";

      for (const line of lines) {
        if (/^#{0,6}\s*Question\s*\d+/i.test(line)) {
          continue;
        }

        const optionMatch = line.match(/^([A-D])[\).:-]\s*(.+)$/i);
        if (optionMatch) {
          const index = optionMatch[1].toUpperCase().charCodeAt(0) - 65;
          optionsByIndex[index] = optionMatch[2].trim();
          continue;
        }

        const answerMatch = line.match(/^(?:correct\s*)?(?:answer|option)\s*[:\-]\s*(.+)$/i);
        if (answerMatch) {
          answer = answerMatch[1].trim();
          continue;
        }

        const explanationMatch = line.match(/^explanation\s*[:\-]\s*(.+)$/i);
        if (explanationMatch) {
          explanation = explanationMatch[1].trim();
          continue;
        }

        if (!optionsByIndex.length) {
          questionLines.push(line);
        }
      }

      const options = optionsByIndex.filter(Boolean);
      if (!questionLines.length || options.length < 2) return null;

      return normalizeQuestion({
        question: questionLines.join(" "),
        options,
        answer,
        correctAnswer: answer,
        explanation,
      });
    })
    .filter(Boolean);
};

const parseQuiz = (value) => {
  try {
    const questions = parseJsonQuiz(value);
    if (questions.length) return questions;
  } catch (err) {
    // Fall through to markdown parsing for older API responses.
  }

  return parseMarkdownQuiz(value);
};

export default function QuizUI({ ai }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [time, setTime] = useState(30);

  useEffect(() => {
    if (!ai) return;

    const parsedQuestions = parseQuiz(ai);

    if (!parsedQuestions.length) {
      console.error("Quiz parse failed:", ai);
      setQuestions([]);
      return;
    }

    setQuestions(parsedQuestions);
    setCurrent(0);
    setAnswers({});
    setShowResult(false);
    setTime(30);
  }, [ai]);

  useEffect(() => {
    if (showResult || !questions.length) return;

    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          if (current < questions.length - 1) {
            setCurrent((c) => c + 1);
            setTime(30);
          } else {
            setShowResult(true);
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [current, showResult, questions.length]);

  if (!questions.length) {
    return (
      <div className="text-center text-gray-400 mt-10">
        No quiz available
      </div>
    );
  }

  const isFinished = current === questions.length - 1;

  const score = questions.reduce((acc, q, i) => {
    if (answers[i] === undefined || q.answer < 0) return acc;
    return acc + (answers[i] === q.answer ? 1 : 0);
  }, 0);

  if (showResult) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-purple-400">
            Your Score
          </h2>

          <p className="text-xl text-white mt-2">
            {score} / {questions.length}
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((q, i) => {
            const userAnswer = answers[i];
            const hasCorrectAnswer = q.answer >= 0;
            const isCorrect = hasCorrectAnswer && userAnswer === q.answer;

            return (
              <div
                key={i}
                className="p-5 rounded-xl bg-[#0f172a] border border-white/10 space-y-3"
              >
                <h3 className="text-white font-semibold">
                  Q{i + 1}. {q.question}
                </h3>

                {q.options.map((opt, idx) => {
                  let style = "bg-[#1e293b]";

                  if (idx === q.answer) {
                    style = "bg-green-500/20 border border-green-500";
                  }

                  if (idx === userAnswer && idx !== q.answer) {
                    style = "bg-red-500/20 border border-red-500";
                  }

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${style}`}
                    >
                      {opt}
                    </div>
                  );
                })}

                {q.explanation && (
                  <p className="text-sm text-gray-300 mt-2">
                    {q.explanation}
                  </p>
                )}

                <p className={`text-sm font-medium ${
                  isCorrect ? "text-green-400" : "text-red-400"
                }`}>
                  {hasCorrectAnswer
                    ? isCorrect
                      ? "Correct"
                      : "Incorrect"
                    : "Correct answer not provided by AI"}
                </p>

                <p className="text-sm text-green-300">
                  Correct answer: {q.correctAnswer || "Not provided"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              setCurrent(0);
              setAnswers({});
              setShowResult(false);
            }}
            className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Restart Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-right text-sm text-gray-400">
        {time}s
      </div>

      <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden">
        <div
          className="bg-purple-500 h-full transition-all duration-300"
          style={{
            width: `${((current + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="text-sm text-gray-400">
        Question {current + 1} of {questions.length}
      </div>

      <QuizCard
        q={questions[current]}
        index={current}
        selected={answers[current]}
        setSelected={(val) => {
          setAnswers((prev) => ({ ...prev, [current]: val }));

          setTimeout(() => {
            if (current < questions.length - 1) {
              setCurrent((c) => c + 1);
              setTime(30);
            } else {
              setShowResult(true);
            }
          }, 400);
        }}
        showResult={showResult}
      />

      <div className="flex justify-between">
        <button
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
          className="px-5 py-2 rounded-lg bg-gray-700 disabled:opacity-40"
        >
          Previous
        </button>

        <button
          onClick={() =>
            isFinished
              ? setShowResult(true)
              : setCurrent((c) => c + 1)
          }
          className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700"
        >
          {isFinished ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
