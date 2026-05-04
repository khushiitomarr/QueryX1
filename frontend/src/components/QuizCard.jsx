export default function QuizCard({ q, index, selected, setSelected, showResult }) {
  return (
    <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/10 shadow-xl space-y-6">

      <h2 className="text-xl font-semibold text-white">
        <span className="text-purple-400">Q{index + 1}.</span> {q.question}
      </h2>

      <div className="space-y-3">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = q.answer === i;

          return (
            <button
              key={i}
              onClick={() => !showResult && setSelected(i)}
              className={`w-full text-left p-4 rounded-xl border transition-all
              
              ${
                showResult
                  ? isCorrect
                    ? "bg-green-500/20 border-green-500"
                    : isSelected
                    ? "bg-red-500/20 border-red-500"
                    : "bg-[#1e293b] border-white/10"
                  : isSelected
                  ? "bg-purple-600/20 border-purple-500"
                  : "bg-[#1e293b] border-white/10 hover:bg-[#334155]"
              }
              `}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}