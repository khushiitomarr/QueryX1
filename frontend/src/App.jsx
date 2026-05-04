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
import QuizUI from "./components/QuizUI";
import { BookOpen } from "lucide-react";

const DIFFICULTY_OPTIONS = ["Beginner", "Class 10", "College", "Expert"];

const FOLLOW_UP_ACTIONS = [
  {
    label: "Explain simpler",
    instruction: "Rewrite the answer in simpler words with short examples.",
  },
  {
    label: "Give example",
    instruction: "Give practical examples and explain each one briefly.",
  },
  {
    label: "Make short notes",
    instruction: "Convert the answer into compact revision notes with headings and bullets.",
  },
];

const getSavedSearchState = () => {
  return {
    searched: false,
    query: "",
    examMode: false,
    quizMode: false,
  };
};

const getSavedResults = (query) => {
  if (!query) return [];

  const saved = JSON.parse(localStorage.getItem("offlineData")) || [];
  const match = saved.find(
    item => item.query?.toLowerCase() === query.toLowerCase()
  );

  return match?.results || [];
};

const getSavedAi = ({ query, examMode, quizMode }) => {
  if (!query) return "";

  const mode = quizMode ? "quiz" : examMode ? "exam" : "normal";
  const saved = JSON.parse(localStorage.getItem("aiData")) || [];
  const match = saved.find(
    item =>
      item.query?.toLowerCase() === query.toLowerCase() &&
      (item.mode === mode || item.mode?.startsWith(`${mode}:`))
  );

  return match?.ai || "";
};

const safeParseArray = (value) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getCurrentUser = () => {
  const savedUser = localStorage.getItem("user");
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
};

const getNotebookStorageKey = (user) => {
  const userKey = user?._id || user?.id || user?.email;
  return userKey ? `queryxNotebook:${userKey}` : "queryxNotebook:guest";
};

const getSavedNotebookEntries = (user) =>
  safeParseArray(localStorage.getItem(getNotebookStorageKey(user)));

export default function App() {
  const navigate = useNavigate();
  const savedSearch = getSavedSearchState();
  const savedUser = getCurrentUser();

  const [theme, setTheme] = useState("dark");
  const [searched, setSearched] = useState(savedSearch.searched);
  const [showChat, setShowChat] = useState(false);
  const [query, setQuery] = useState(savedSearch.query);
  const [results, setResults] = useState(() => getSavedResults(savedSearch.query));
  const [ai, setAi] = useState(() => getSavedAi(savedSearch));
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [user, setUser] = useState(savedUser);
  const [searchType, setSearchType] = useState("all");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [page, setPage] = useState(1);
  const [examMode, setExamMode] = useState(savedSearch.examMode);
  const [searchFn, setSearchFn] = useState(null);
  const [quizMode, setQuizMode] = useState(savedSearch.quizMode);
  const [expanded, setExpanded] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState(
    () => localStorage.getItem("difficultyLevel") || "Class 10"
  );
  const [followUpInstruction, setFollowUpInstruction] = useState("");
  const [showNotebook, setShowNotebook] = useState(false);
  const [notebookEntries, setNotebookEntries] = useState(
    () => getSavedNotebookEntries(savedUser)
  );
  const [selectedNotebookEntry, setSelectedNotebookEntry] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const isModeChange = useRef(false);
  const restoredSearchRef = useRef(false);

  useEffect(() => {
    setExpanded(false);
  }, [ai]);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }

    sessionStorage.removeItem("lastQuery");
    sessionStorage.removeItem("searched");
    localStorage.removeItem("lastQuery");
    localStorage.removeItem("searched");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setTheme(localStorage.getItem("theme") || "dark");
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    const entries = getSavedNotebookEntries(user);
    setNotebookEntries(entries);
    setSelectedNotebookEntry(entries[0] || null);
    if (!entries.length) setShowNotebook(false);
  }, [user]);
  useEffect(() => {
    const handleScroll = () => {
      if (!searchFn) return; // 🔥 IMPORTANT
      if (searchType !== "all") return;

      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setPage(prev => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [searchFn, searchType]);

  useEffect(() => {
    if (searchType === "all" && page > 1 && typeof searchFn === "function" && navigator.onLine) {
      searchFn(query, page);
    }
  }, [page, searchFn, searchType]);

  useEffect(() => {
    if (!searched || !query || typeof searchFn !== "function" || !navigator.onLine) return;

    if (searchType === "images" && images.length === 0) {
      searchFn(query, 1);
    }

    if (searchType === "videos" && videos.length === 0) {
      searchFn(query, 1);
    }
  }, [searchType, searched, query, searchFn, images.length, videos.length]);

  useEffect(() => {
    if (restoredSearchRef.current) return;
    if (!searched || !query || typeof searchFn !== "function") return;
    if (results.length > 0 && ai) return;

    restoredSearchRef.current = true;
    searchFn(query, 1);
  }, [searched, query, searchFn, results.length, ai]);

  useEffect(() => {
    setPage(1);
  }, [query]);



  useEffect(() => {
    localStorage.setItem("examMode", examMode);
  }, [examMode]);

  useEffect(() => {
    localStorage.setItem("quizMode", quizMode);
  }, [quizMode]);

  useEffect(() => {
    localStorage.setItem("difficultyLevel", difficultyLevel);
  }, [difficultyLevel]);

  useEffect(() => {
    if (!query || !searched || !searchFn) return;
    if (typeof searchFn !== "function") return;

    if (!isModeChange.current) return;

    console.log("🔁 Mode switched → refetching AI");

    setAi("");
    setAiLoading(true);
    searchFn(query, 1);

  }, [examMode, quizMode]);

  const previewLength = 500;
  const isLong = ai.length > previewLength;

  const displayText = expanded
    ? ai
    : ai.slice(0, previewLength) + (isLong ? "..." : "");

  const handleHomeClick = () => {
    sessionStorage.removeItem("lastQuery");
    sessionStorage.removeItem("searched");
    localStorage.removeItem("lastQuery");
    localStorage.removeItem("searched");
    localStorage.setItem("examMode", "false");
    localStorage.setItem("quizMode", "false");

    setSearched(false);
    setQuery("");
    setResults([]);
    setImages([]);
    setVideos([]);
    setAi("");
    setAiLoading(false);
    setLoading(false);
    setExamMode(false);
    setQuizMode(false);
    setSearchType("all");
    setPage(1);
    setExpanded(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/");
  };

  const requestAiRefresh = (instruction) => {
    if (!query.trim()) return;

    setAi("");
    setAiLoading(true);
    setFollowUpInstruction(instruction);
  };

  const handleDifficultyChange = (level) => {
    setDifficultyLevel(level);
    if (searched && query.trim()) {
      requestAiRefresh(`Rewrite this for a ${level} student. Keep it useful for studying.`);
    }
  };

  const handleSaveToNotebook = () => {
    if (!query.trim() || !ai || ai === "AI failed") return;

    const notebookStorageKey = getNotebookStorageKey(user);
    const saved = getSavedNotebookEntries(user);
    const entry = {
      id: `${Date.now()}-${query.toLowerCase()}`,
      query,
      ai,
      difficultyLevel,
      mode: quizMode ? "quiz" : examMode ? "exam" : "normal",
      savedAt: new Date().toISOString(),
    };

    const next = [
      entry,
      ...saved.filter(
        item =>
          !(
            item.query?.toLowerCase() === query.toLowerCase() &&
            item.mode === entry.mode &&
            item.difficultyLevel === difficultyLevel
          )
      ),
    ].slice(0, 60);

    localStorage.setItem(notebookStorageKey, JSON.stringify(next));
    setNotebookEntries(next);
    setSelectedNotebookEntry(entry);
    setShowNotebook(true);
  };

  const handleDeleteNotebookEntry = (entryId) => {
    const next = notebookEntries.filter(entry => entry.id !== entryId);

    localStorage.setItem(getNotebookStorageKey(user), JSON.stringify(next));
    setNotebookEntries(next);

    if (selectedNotebookEntry?.id === entryId) {
      setSelectedNotebookEntry(next[0] || null);
      if (!next.length) setShowNotebook(false);
    }
  };

  const handlePracticeQuiz = () => {
    if (!query.trim()) return;

    setExamMode(false);
    setQuizMode(true);
    requestAiRefresh(
      "Create 5 multiple-choice practice questions with 4 options, the correct answer, and a short explanation for each."
    );
  };

  return (

    <div
      className={`${searched ? "min-h-screen" : "h-screen overflow-hidden"} flex flex-col justify-between`}
      style={{ background: "var(--bg)" }}
    >

      <Header
        theme={theme}
        setTheme={setTheme}
        searchType={searchType}
        setSearchType={setSearchType}
        onHomeClick={handleHomeClick}
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
            searchType={searchType}
            examMode={examMode}
            setExamMode={setExamMode}
            quizMode={quizMode}
            setQuizMode={setQuizMode}
            isModeChange={isModeChange}
            difficultyLevel={difficultyLevel}
            followUpInstruction={followUpInstruction}
            clearFollowUpInstruction={() => setFollowUpInstruction("")}
            handleSearchExternal={setSearchFn}
            compact
          />
        )}
      </Header>


      <main className={`${searched ? "flex-grow pt-48" : "home-main flex-none"} flex flex-col items-center`}>

        {!searched && (
          <div className="home-hero flex flex-1 min-h-0 flex-col items-center justify-center w-full">

            <h1 className="home-title text-5xl font-bold mb-10 text-center">
              Search smarter with{" "}
              <span className="hero-brand bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 
      bg-clip-text text-transparent animate-pulse">
                QueryX
              </span>
            </h1>

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
              searchType={searchType}
              examMode={examMode}
              setExamMode={setExamMode}
              quizMode={quizMode}
              setQuizMode={setQuizMode}
              isModeChange={isModeChange}
              difficultyLevel={difficultyLevel}
              followUpInstruction={followUpInstruction}
              clearFollowUpInstruction={() => setFollowUpInstruction("")}
              handleSearchExternal={setSearchFn}
              compact
            />

            {isOffline && (
              <button
                onClick={() => {
                  setSelectedNotebookEntry(notebookEntries[0] || null);
                  setShowNotebook(true);
                }}
                className="home-notebook-button mt-5"
              >
                <BookOpen size={18} />
                Offline Notebook
                <span>{notebookEntries.length}</span>
              </button>
            )}

          </div>
        )}

        {searched && (
          <div className="w-full px-4">
            <div
              className={`search-results-layout grid gap-6 ${searchType === "all"
                ? "xl:grid-cols-[240px_minmax(16px,1fr)_minmax(0,1080px)_minmax(16px,1fr)_240px] lg:grid-cols-[240px_minmax(0,1fr)]"
                : "grid-cols-1"
                }`}
            >
              {searchType === "all" && (
                <aside className="notebook-sidebar rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-sm font-semibold text-purple-400">
                      Offline Notebook
                    </h2>
                    <span className="text-xs opacity-60">
                      {notebookEntries.length}
                    </span>
                  </div>

                  {notebookEntries.length === 0 ? (
                    <p className="text-sm opacity-70">
                      Saved notes appear here offline.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {notebookEntries.map(entry => (
                        <div
                          key={entry.id}
                          className="notebook-title-row rounded-xl border p-2"
                        >
                        <button
                          onClick={() => {
                            setSelectedNotebookEntry(entry);
                            setShowNotebook(true);
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block text-sm font-medium truncate">
                            {entry.query}
                          </span>
                          <span className="mt-1 block text-xs opacity-60">
                            {entry.difficultyLevel} · {entry.mode}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteNotebookEntry(entry.id)}
                          className="notebook-delete-button"
                          title="Delete note"
                        >
                          Delete
                        </button>
                        </div>
                      ))}
                    </div>
                  )}
                </aside>
              )}

              <section
                className={`grid gap-6 ${searchType === "all"
                  ? "study-content-block xl:grid-cols-[470px_minmax(0,1fr)]"
                  : "media-content-block grid-cols-1"
                  }`}
              >
              {/* LEFT */}
              {searchType === "all" && (
                <div className="space-y-6">
                  <div className="ai-panel search-ai-panel p-6 rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#020617] border border-white/10 shadow-xl">

                    {/* HEADER */}
                    {/* Inside the AI Overview div */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <h2 className="text-sm font-semibold text-purple-400">
                        AI Overview {examMode && <span className="ml-2 text-[10px] bg-purple-500/20 px-2 py-0.5 rounded text-white border border-purple-500/50">EXAM MODE</span>}
                      </h2>
                    </div>

                    <div className="student-tools mb-5 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {DIFFICULTY_OPTIONS.map(level => (
                          <button
                            key={level}
                            onClick={() => handleDifficultyChange(level)}
                            className={`student-tool-button ${
                              difficultyLevel === level ? "student-tool-active" : ""
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleSaveToNotebook}
                          disabled={!ai || ai === "AI failed" || aiLoading}
                          className="student-tool-button disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Save to Notebook
                        </button>
                        <button
                          onClick={handlePracticeQuiz}
                          disabled={!query.trim() || aiLoading}
                          className="student-tool-button disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Practice Quiz
                        </button>
                        {FOLLOW_UP_ACTIONS.map(action => (
                          <button
                            key={action.label}
                            onClick={() => {
                              setQuizMode(false);
                              requestAiRefresh(action.instruction);
                            }}
                            disabled={!query.trim() || aiLoading}
                            className="student-tool-button disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {aiLoading ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                      </div>
                    ) : ai && ai !== "AI failed" ? (

                      quizMode ? (
                        <div className="ai-answer-scroll">
                          <QuizUI ai={ai} />
                        </div>
                      ) : (
                        <div className="ai-answer-scroll prose prose-invert max-w-none 
      prose-h3:text-green-400 
      prose-p:text-gray-300
      prose-li:text-gray-300
      space-y-4">

                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {displayText
                              .replace(/^Overview$/gm, "## Overview")
                              .replace(/^Key Points.*$/gm, "## Key Points 📌")
                              .replace(/^Definition.*$/gm, "## Definition 🧠")
                              .replace(/^Important Questions.*$/gm, "## Important Questions ❓")
                              .replace(/^Quick Revision.*$/gm, "## Quick Revision 📝")
                            }
                          </ReactMarkdown>

                          {isLong && (
                            <button
                              onClick={() => setExpanded(prev => !prev)}
                              className="mt-3 text-sm text-purple-400 hover:underline"
                            >
                              {expanded ? "Show Less ↑" : "Read More ↓"}
                            </button>
                          )}
                        </div>
                      )

                    ) : (
                      <div className="text-sm text-gray-400 italic">
                        ⚡ No AI overview available for this search.
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* RIGHT */}
              <div className="results-column space-y-4">

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
                        <div className="result-card p-6 bg-gray-800 rounded-xl hover:bg-gray-700 transition space-y-2">

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
              </section>
            </div>
          </div>
        )}
      </main>

      <Footer />
      {showNotebook && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          onClick={() => setShowNotebook(false)}
        >
          <div
            className="notebook-panel w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl border p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold">
                {selectedNotebookEntry ? selectedNotebookEntry.query : "Saved Notebook"}
              </h2>
              <button
                onClick={() => setShowNotebook(false)}
                className="student-tool-button"
              >
                Close
              </button>
            </div>

            {notebookEntries.length === 0 ? (
              <p className="text-sm opacity-70">
                No notes saved yet. Search a topic, then click Save to Notebook.
              </p>
            ) : selectedNotebookEntry ? (
              <article className="notebook-entry rounded-xl border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs opacity-60">
                    {selectedNotebookEntry.difficultyLevel} · {selectedNotebookEntry.mode}
                  </span>
                  <button
                    onClick={() => handleDeleteNotebookEntry(selectedNotebookEntry.id)}
                    className="notebook-delete-button"
                  >
                    Delete note
                  </button>
                </div>
                <div className="prose prose-invert max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedNotebookEntry.ai}
                  </ReactMarkdown>
                </div>
              </article>
            ) : (
              <div className="space-y-4">
                {notebookEntries.map(entry => (
                  <div key={entry.id} className="notebook-title-row rounded-xl border p-4">
                    <button
                      onClick={() => setSelectedNotebookEntry(entry)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="font-semibold">{entry.query}</span>
                      <span className="ml-2 text-xs opacity-60">
                        {entry.difficultyLevel} · {entry.mode}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteNotebookEntry(entry.id)}
                      className="notebook-delete-button"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showChat && (
        <div className="fixed bottom-20 right-6 z-50 animate-fadeIn">
          <ChatBot onClose={() => setShowChat(false)} />
        </div>
      )}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowChat(prev => !prev)}
          className="p-4 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg text-xl transition-transform hover:scale-110"
        >

          {showChat ? "✖" : "💬"}

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
