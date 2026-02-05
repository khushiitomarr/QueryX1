import { Search, Mic } from "lucide-react";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SearchBar({
  query,
  setQuery,
  setSearched,
  results,
  setResults,
  ai,
  setAi,
  loading,
  setLoading,
  aiLoading,
  setAiLoading,
  compact = false,
}) {
  const controllerRef = useRef(null);
  const searchingRef = useRef(false);

  const handleSearch = async () => {
    if (!query.trim() || searchingRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to search");
      return;
    }

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    searchingRef.current = true;

    setSearched(true);
    setLoading(true);
    setAiLoading(true);
    setAi("");

    try {
      // 🔍 SEARCH FIRST
      const searchRes = await fetch(
        `http://localhost:5000/api/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controllerRef.current.signal,
        }
      );

      const searchData = await searchRes.json();
      setResults(searchData.results || []);
      setLoading(false);

      // 🤖 AI (BACKGROUND)
      fetch("http://localhost:5000/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      })
        .then((res) => res.json())
        .then((data) => setAi(data.answer || ""))
        .catch(() => setAi("AI unavailable"))
        .finally(() => setAiLoading(false));

    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
        setResults([]);
        setAi("AI unavailable");
        setLoading(false);
        setAiLoading(false);
      }
    }

    searchingRef.current = false;
  };

  return (
    <div className={`${compact ? "w-full max-w-[600px]" : "w-[900px] max-w-[95vw]"}`}>
      
      {/* 🔍 SEARCH INPUT */}
      <div
        className="relative rounded-full border border-white/10 shadow-xl"
        style={{ backgroundColor: "var(--card)" }}
      >
        <Search
          size={22}
          className="absolute left-6 top-1/2 -translate-y-1/2"
          style={{ color: "var(--accent)" }}
        />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search QueryX..."
          className="w-full py-4 pl-16 pr-16 rounded-full bg-transparent outline-none"
          style={{ color: "var(--text)" }}
        />

        <Mic
          size={22}
          className="absolute right-6 top-1/2 -translate-y-1/2"
          style={{ color: "var(--accent)" }}
        />
      </div>

      {/* 🧠 AI + RESULTS */}
      {!compact && (loading || ai || results.length > 0) && (
        <div className="mt-10 w-full max-w-[1100px] flex flex-col md:flex-row gap-8">

          {/* 🤖 AI ANSWER */}
          <div
            className="w-full md:w-[35%] rounded-xl p-6 shadow"
            style={{ backgroundColor: "var(--card)" }}
          >
            <h2 className="text-xl font-bold mb-4">AI Answer</h2>

            {aiLoading && (
              <p className="opacity-70 animate-pulse">Generating answer…</p>
            )}

            {!aiLoading && ai && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold mt-4 mb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mt-3 mb-1">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="leading-relaxed mb-2 opacity-90">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 mb-3 space-y-1">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="opacity-90">{children}</li>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-black/40 rounded-lg p-3 text-sm overflow-x-auto mb-3">
                      {children}
                    </pre>
                  ),
                  code: ({ children }) => (
                    <code className="bg-black/30 px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  ),
                }}
              >
                {ai}
              </ReactMarkdown>
            )}
          </div>

          {/* 🌐 SEARCH RESULTS */}
          <div className="flex-1 flex flex-col gap-4">
            {loading && <p className="opacity-70">Searching…</p>}

            {!loading && results.length === 0 && (
              <p className="opacity-60">No results found</p>
            )}

            {results.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-xl shadow hover:scale-[1.01] transition"
                style={{ backgroundColor: "var(--card)" }}
              >
                <h3 className="text-lg font-semibold mb-1">
                  {item.title}
                </h3>
                <p className="text-sm opacity-80">
                  {item.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
