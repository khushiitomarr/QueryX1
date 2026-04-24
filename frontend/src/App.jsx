import { useEffect, useState } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import Footer from "./components/Footer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import ChatBot from "./components/ChatBot";
import ImageResults from "./components/ImageResults";
import VideoResults from "./components/VideoResults";
import { useRef } from "react";
import ChatMain from "./pages/ChatMain";

export default function App() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState("dark");
  const [searched, setSearched] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [ai, setAi] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [searchType, setSearchType] = useState("all");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [page, setPage] = useState(1);
  const [examMode, setExamMode] = useState(false);
  const [searchFn, setSearchFn] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
const isModeChange = useRef(false);

  useEffect(() => {
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setTheme(localStorage.getItem("theme") || "dark");
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      if (!searchFn) return; // 🔥 IMPORTANT

      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setPage(prev => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [searchFn]);

  useEffect(() => {
    if (page > 1 && typeof searchFn === "function" && navigator.onLine) {
      searchFn(query, page);
    }
  }, [page, searchFn]);

  useEffect(() => {
    setPage(1);
  }, [query]);



  useEffect(() => {
    const savedQuery = localStorage.getItem("lastQuery");
    const wasSearched = localStorage.getItem("searched");

    if (savedQuery && wasSearched === "true") {
      setQuery(savedQuery);

      setSearched(true);
    }
  }, []);



  useEffect(() => {
    const savedMode = localStorage.getItem("examMode");
    if (savedMode !== null) {
      setExamMode(savedMode === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("examMode", examMode);
  }, [examMode]);

 useEffect(() => {
  if (!query || !searched || !searchFn) return;
  if (typeof searchFn !== "function") return;

  if (!isModeChange.current) return; 

  console.log("🔁 Mode switched → refetching AI");

  setAi("");
  setAiLoading(true);
  searchFn(query, 1);

}, [examMode, quizMode]);

  return (
    
    <div className="min-h-screen flex flex-col justify-between" style={{ background: "var(--bg)" }}>

      <Header
        theme={theme}
        setTheme={setTheme}
        searchType={searchType}
        setSearchType={setSearchType}
        searched={searched}   // ✅ ADD THIS
      >
        {searched && (
          <SearchBar
            user={user}
            query={query}
            setQuery={setQuery}
            setSearched={setSearched}
            setResults={setResults}
            setAi={setAi}
            setLoading={setLoading}
            setAiLoading={setAiLoading}
            setImages={setImages}
            setVideos={setVideos}
            examMode={examMode}
            setExamMode={setExamMode}
            quizMode={quizMode}
            setQuizMode={setQuizMode}
            isModeChange={isModeChange}
            handleSearchExternal={setSearchFn}
            compact
          />
        )}
      </Header>


      <main className="flex-grow flex flex-col items-center pt-42">

        {!searched && (
          <div className="flex flex-col items-center justify-center h-full w-full">

            <h1 className="text-5xl font-bold mb-10 text-center">
              Search smarter with{" "}
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 
      bg-clip-text text-transparent animate-pulse">
                QueryX
              </span>
            </h1>

            <div className="w-full max-w-2xl">
              <SearchBar
                user={user}
                query={query}
                setQuery={setQuery}
                setSearched={setSearched}
                setResults={setResults}
                setAi={setAi}
                setLoading={setLoading}
                setAiLoading={setAiLoading}
                setImages={setImages}
                setVideos={setVideos}
                examMode={examMode}
                setExamMode={setExamMode}
                quizMode={quizMode}
                setQuizMode={setQuizMode}
                isModeChange={isModeChange}
                handleSearchExternal={setSearchFn}
              />
            </div>

          </div>
        )}

        {searched && (
          <div className="w-full max-w-[1100px]">
            <div
              className={`grid gap-8 ${searchType === "all"
                ? "md:grid-cols-[320px_1fr]"
                : "grid-cols-1"
                }`}
            >

              {/* LEFT */}
              {searchType === "all" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#020617] border border-white/10 shadow-xl">

                    {/* HEADER */}
                    {/* Inside the AI Overview div */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <h2 className="text-sm font-semibold text-purple-400">
                        AI Overview {examMode && <span className="ml-2 text-[10px] bg-purple-500/20 px-2 py-0.5 rounded text-white border border-purple-500/50">EXAM MODE</span>}
                      </h2>
                    </div>

                    {aiLoading ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                      </div>
                    ) : ai && ai !== "AI failed" ? (

                      <div className="prose prose-invert max-w-none 
  prose-h3:text-green-400 
  prose-h3:text-lg 
  prose-h3:font-bold
  prose-p:text-gray-300
  prose-strong:text-green-300
  prose-li:text-gray-300
  space-y-4">

                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {ai
                            .replace(/^Overview$/gm, "## Overview")
                            .replace(/^Key Points.*$/gm, "## Key Points 📌")
                            .replace(/^Definition.*$/gm, "## Definition 🧠")
                            .replace(/^Important Questions.*$/gm, "## Important Questions ❓")
                            .replace(/^Quick Revision.*$/gm, "## Quick Revision 📝")
                          }
                        </ReactMarkdown>

                      </div>

                    ) : (
                      <div className="text-sm text-gray-400 italic">
                        ⚡ No AI overview available for this search.
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* RIGHT */}
              <div className="space-y-4">

                {searchType === "all" && (
                  <>
                    {loading && searchType === "all" && results.length === 0 && (
                      <div className="space-y-6">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-20 bg-gray-800 rounded animate-pulse"></div>
                        ))}
                      </div>
                    )}
                    {results.map((r, i) => (
                      <a key={i} href={r.url} target="_blank" className="block">
                        <div className="p-6 bg-gray-800 rounded-xl hover:bg-gray-700 transition space-y-2">

                          <h3 className="text-lg font-semibold">
                            {r.title}
                          </h3>

                          <p className="text-sm text-gray-300 leading-relaxed">
                            {r.description}
                          </p>

                        </div>
                      </a>
                    ))}
                  </>
                )}

                {searchType === "images" && (
                  <ImageResults images={images} setSelectedImage={setSelectedImage} />
                )}

                {searchType === "videos" && (
                  <VideoResults videos={videos} setSelectedVideo={setSelectedVideo} />
                )}

              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      {showChat && (
        <div className="fixed bottom-20 right-6 z-50">
          <ChatBot />
        </div>
      )}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => window.open("/chat", "_blank")}
          className="p-4 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg text-xl transition-transform hover:scale-110"
        >
          💬
        </button>
      </div>
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-4xl w-full px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              className="w-full rounded-lg"
            />

            <p className="text-white mt-2 text-center">
              {selectedImage.title}
            </p>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white text-2xl"
          >
            ✖
          </button>
        </div>
      )}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="w-[90%] max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-6 right-6 text-white text-2xl"
            >
              ✖
            </button>
            <iframe
              src={
                selectedVideo.link.includes("watch?v=")
                  ? selectedVideo.link.replace("watch?v=", "embed/") + "?autoplay=1"
                  : selectedVideo.link + "?autoplay=1"
              }
              className="w-full h-[400px] rounded-lg"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>

            <h3 className="mt-3 text-white">
              {selectedVideo.title}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}