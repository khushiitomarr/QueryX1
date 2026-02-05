import { useEffect, useState } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import Footer from "./components/Footer";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [searched, setSearched] = useState(false);

  // 🔍 SHARED SEARCH STATE
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [ai, setAi] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Load saved theme
  useEffect(() => {
    setTheme(localStorage.getItem("theme") || "dark");
  }, []);

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* BACKGROUND */}
      <div className="stars" />
      <div className="stars2" />
      <div className="stars3" />

      {/* HEADER */}
      <Header theme={theme} setTheme={setTheme}>
        {searched && (
          <SearchBar
            query={query}
            setQuery={setQuery}
            setSearched={setSearched}
            results={results}
            setResults={setResults}
            ai={ai}
            setAi={setAi}
            loading={loading}
            setLoading={setLoading}
            aiLoading={aiLoading}
            setAiLoading={setAiLoading}
            compact
          />
        )}
      </Header>

      {/* MAIN */}
      <main
        className={`flex flex-col items-center w-full relative z-10 grow transition-all duration-500 ${
          searched ? "pt-24" : "pt-32"
        }`}
        style={{ color: "var(--text)" }}
      >
        {!searched && (
          <>
            <h1 className="text-5xl font-extrabold mb-12 text-center">
              Search smarter with{" "}
              <span style={{ color: "var(--accent)" }}>QueryX</span>
            </h1>

            <SearchBar
              query={query}
              setQuery={setQuery}
              setSearched={setSearched}
              results={results}
              setResults={setResults}
              ai={ai}
              setAi={setAi}
              loading={loading}
              setLoading={setLoading}
              aiLoading={aiLoading}
              setAiLoading={setAiLoading}
            />
          </>
        )}

        {/* RESULTS + AI */}
        {searched && (
          <div className="w-full max-w-[1100px] mt-10 flex flex-col md:flex-row gap-8">
            {/* AI BOX */}
            <div
              className="w-full md:w-[35%] rounded-xl p-6 shadow"
              style={{ backgroundColor: "var(--card)" }}
            >
              <h2 className="text-xl font-bold mb-3">AI Answer</h2>

              {aiLoading && <p className="opacity-70">Thinking…</p>}
              {!aiLoading && ai && (
                <p className="leading-relaxed opacity-90">{ai}</p>
              )}
              {!aiLoading && !ai && (
                <p className="opacity-50">No AI response</p>
              )}
            </div>

            {/* SEARCH RESULTS */}
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
                  <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm opacity-80">{item.description}</p>
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
