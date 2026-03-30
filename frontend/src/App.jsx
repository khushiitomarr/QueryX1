import { useEffect, useState } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import Footer from "./components/Footer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState("dark");
  const [searched, setSearched] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [ai, setAi] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [intent, setIntent] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setTheme(localStorage.getItem("theme") || "dark");
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: "var(--bg)" }}>
      
      <Header theme={theme} setTheme={setTheme}>
        {searched && (
          <SearchBar
            query={query}
            setQuery={setQuery}
            setSearched={setSearched}
            setResults={setResults}
            setAi={setAi}
            setLoading={setLoading}
            setAiLoading={setAiLoading}
            setIntent={setIntent}
            compact
          />
        )}
      </Header>

      <main className="flex-grow flex flex-col items-center pt-24">
        
        {!searched && (
          <>
            <h1 className="text-5xl font-bold mb-10 text-center">
              Search smarter with <span style={{ color: "var(--accent)" }}>QueryX</span>
            </h1>

            <SearchBar
              query={query}
              setQuery={setQuery}
              setSearched={setSearched}
              setResults={setResults}
              setAi={setAi}
              setLoading={setLoading}
              setAiLoading={setAiLoading}
              setIntent={setIntent}
            />
          </>
        )}

        {searched && (
          <div className="w-full max-w-[1100px] grid md:grid-cols-[300px_1fr] gap-8 mt-10">
            
            {/* LEFT */}
            <div className="space-y-4">
              
              {intent && (
                <div className="p-3 rounded-lg bg-gray-800">
                  {intent === "learning" && "🎓 Learning Mode"}
                  {intent === "shopping" && "🛒 Shopping Mode"}
                  {intent === "guide" && "📘 Guide Mode"}
                </div>
              )}

              <div className="p-6 rounded-xl bg-gray-900">
                {aiLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                ) : ai ? (
                  <>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {ai.slice(0, 200)}
                    </ReactMarkdown>

                    {ai.length > 200 && (
                      <button
                        onClick={() => {
                          localStorage.setItem("aiData", ai);
                          navigate("/ai");
                        }}
                        className="text-purple-400"
                      >
                        Read more →
                      </button>
                    )}
                  </>
                ) : (
                  <p>No AI response</p>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              {loading && <p>Searching...</p>}

              {results.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noreferrer"
                   className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700">
                  <h3>{r.title}</h3>
                  <p>{r.description}</p>
                </a>
              ))}
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}