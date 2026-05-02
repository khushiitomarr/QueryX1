import { Search, Mic } from "lucide-react";
import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect } from "react";

export default function SearchBar({
  user,
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
  setImages,
  setVideos,
  handleSearchExternal,
  examMode,
  setExamMode,
  quizMode,
  setQuizMode,
  isModeChange,
  compact = false,
}) {
  const [listening, setListening] = useState(false);
  const controllerRef = useRef(null);
  const searchingRef = useRef(false);
  const clearedRef = useRef(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const token = localStorage.getItem("token");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const debounceRef = useRef(null);
  const aiMemoryCache = useRef({});

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
  fetchHistory(); // always try
}, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    fetchSuggestions(query);
  }, [query]);

  const fetchSuggestions = (text) => {
    if (isOffline) {
      const offline = JSON.parse(localStorage.getItem("offlineData")) || [];

      const filtered = offline
        .map(item => item.query)
        .filter(q => q.toLowerCase().includes(text.toLowerCase()));

      setSuggestions(filtered.slice(0, 6));
      return;
    }
    console.log("Fetching suggestions for:", text);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (!text.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(
          `https://queryx1.onrender.com/api/suggest/suggestions?q=${text}`
        );

        const data = await res.json();
        const sugg = data || [];

        if (sugg.length > 0) {
          setSuggestions(sugg);
        } else {

          const historyData = history.map(item => item.query);
          const filtered = historyData.filter(q =>
            q.toLowerCase().includes(text.toLowerCase())
          );

          const smart = [
            ...filtered,
            text + " tutorial",
            text + " meaning",
            text + " examples",
            text + " course"
          ];

          setSuggestions([...new Set(smart)].slice(0, 6));
        }
      } catch (err) {
        console.error("Suggestion error:", err);

        // 🔥 OFFLINE MODE
        const historyData = history.map(item => item.query);

        const filtered = historyData.filter(q =>
          q.toLowerCase().includes(text.toLowerCase())
        );

        setSuggestions(filtered.length > 0 ? filtered : [
          text + " tutorial",
          text + " meaning",
          text + " examples"
        ]);
      }
    }, 300);


    if (text.length > 2 && navigator.onLine) {
      fetch(`https://queryx1.onrender.com/api/search?q=${encodeURIComponent(text)}`)
        .then(res => res.json())
        .then(data => {
          const offline = JSON.parse(localStorage.getItem("offlineData")) || [];
          const exists = offline.find(
            item => item.query.toLowerCase() === text.toLowerCase()
          );

          if (!exists && data.results) {
            offline.unshift({
              query: text,
              results: data.results
            });

            localStorage.setItem("offlineData", JSON.stringify(offline.slice(0, 50)));
          }
        })
        .catch(() => { });
    }
  };

  const fetchHistory = async () => {
    console.log("Fetching history...");
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setHistory([]); // 🔥 clear history for guest
        return;
      }
      
      const res = await fetch("https://queryx1.onrender.com/api/search/history", {
        headers: token
        ? { Authorization: `Bearer ${token}` }
        : {}
      });
      const data = await res.json();
      console.log("History response:", data);
      setHistory(data);
    } catch (err) {
      console.error(err);
      setHistory([]);
      setShowHistory(false);
    }
  };

  const handleSearch = async (customQuery, page = 1) => {

    const finalQuery = typeof customQuery === "string"
      ? customQuery.trim()
      : (query || "").trim();
    localStorage.setItem("lastQuery", finalQuery);
    localStorage.setItem("searched", "true");
    const storageKey = finalQuery.toLowerCase();

    const cache = JSON.parse(localStorage.getItem("offlineData")) || [];
    const cached =
      cache.find(item => item.query.toLowerCase().includes(storageKey));

    if (cached && page === 1) {
      setResults(cached.results); // ⚡ instant result
    }
    const aiCache = JSON.parse(localStorage.getItem("aiData")) || [];

    const currentMode = quizMode
      ? "quiz"
      : examMode
        ? "exam"
        : "normal";
    console.log("🔥 Sending mode:", currentMode);

    const aiMatch = aiCache.find(
      item =>
        item.query.toLowerCase() === storageKey &&
        item.mode === currentMode
    );

    if (aiMatch && page === 1 && !isModeChange.current) {
  setAi(aiMatch.ai);
  setAiLoading(false);
}
    if (!finalQuery || searchingRef.current) return;
    clearedRef.current = false;

    const token = localStorage.getItem("token");


    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    searchingRef.current = true;

    setSearched(true);
    setShowHistory(false); // instant response feel
    if (page === 1 && !cached) {
      setLoading(true);
    }

    if (page === 1 && !aiMatch) {
      setAiLoading(true);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    // --- 1. SEARCH RESULTS LOGIC ---
    try {
      const searchPromise = fetch(
        `https://queryx1.onrender.com/api/search?q=${encodeURIComponent(finalQuery)}&page=${page}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controllerRef.current.signal,
        }
      );

      const imgPromise = fetch(
        `https://queryx1.onrender.com/api/images?q=${encodeURIComponent(finalQuery)}`
      );

      const vidPromise = fetch(
        `https://queryx1.onrender.com/api/videos?q=${encodeURIComponent(finalQuery)}`
      );

      const [searchRes, imgRes, vidRes] = await Promise.all([
        searchPromise,
        imgPromise,
        vidPromise
      ]);

      // 🔥 AI separate
      let aiData = null;

      if (!isOffline || examMode || quizMode) {
        try {
          const currentMode = quizMode
            ? "quiz"
            : examMode
              ? "exam"
              : "normal";

          const aiRes = await fetch("https://queryx1.onrender.com/api/ai", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify({
              query: finalQuery,
              mode: currentMode
            })
          });

          aiData = await aiRes.json();

          if (aiData && aiData.answer) {
            setAi(aiData.answer);

            const prev = JSON.parse(localStorage.getItem("aiData")) || [];
            prev.unshift({
              query: finalQuery.toLowerCase(),
              mode: currentMode,
              ai: aiData.answer
            });

            localStorage.setItem("aiData", JSON.stringify(prev.slice(0, 50)));
          }

        } catch (err) {
          console.log("AI fetch failed", err);
        }
      } else {
        // 🔥 ONLY offline fallback here
        const aiCache = JSON.parse(localStorage.getItem("aiData")) || [];

        const match = aiCache.find(
          item =>
            item.query.toLowerCase() === storageKey &&
            item.mode === currentMode
        );

        if (match) {
          setAi(match.ai);
        } else {
          setAi("⚡ No AI available offline");
        }
      }

      const searchData = await searchRes.json();
      const imgData = await imgRes.json();
      const vidData = await vidRes.json();

      setImages(imgData.images || []);
      setVideos(vidData.videos || []);
      const resultsFromServer = searchData.results || [];

      // ❗ DO NOT overwrite if offline or empty
      if (resultsFromServer.length > 0) {
        if (page === 1) {
          setResults(resultsFromServer);
        } else {
          setResults(prev => [...prev, ...resultsFromServer]);
        }
      }

      // Save to localStorage for future offline use
      const offline = JSON.parse(localStorage.getItem("offlineData")) || [];
      const filtered = offline.filter(item => item.query.toLowerCase() !== storageKey);
      if (resultsFromServer.length > 0) {
        const offline = JSON.parse(localStorage.getItem("offlineData")) || [];
        const filtered = offline.filter(item => item.query.toLowerCase() !== storageKey);

        filtered.unshift({
          query: finalQuery.toLowerCase(),
          results: resultsFromServer,
        });

        localStorage.setItem("offlineData", JSON.stringify(filtered.slice(0, 50)));
      }

    } catch (err) {

      console.log("📡 Search fetch failed, checking offline storage...");
      const offline = JSON.parse(localStorage.getItem("offlineData")) || [];
      const match =
        offline.find(item => item.query.toLowerCase() === storageKey);

      if (match) {
        setResults(match.results);
      } else if (!cached) {
        setResults([
          {
            title: "No offline results",
            description: "Connect to internet to search new topics.",
            url: "#"
          }
        ]);
      }
    } finally {
      setLoading(false);
      setAiLoading(false);
      searchingRef.current = false;
      if (isModeChange) isModeChange.current = false;
    }
    await fetchHistory();
    setSuggestions([]);
    setShowHistory(false);
  };
  const handleVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice not supported");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    setListening(true);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;

      console.log("🎤 Heard:", text);

      setQuery(text);

      // ✅ FIX: pass directly instead of waiting
      handleSearch(text);
    };

    recognition.onerror = (e) => {
      console.error("Mic error:", e);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };
  const clearHistory = async () => {
    try {
      const token = localStorage.getItem("token"); // Get the token

      const res = await fetch("https://queryx1.onrender.com/api/search/history", {
        method: "DELETE",
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {}
      });

      if (res.ok) {
        clearedRef.current = true;
        setHistory([]);
        setShowHistory(false);
      } else {
        console.error("Server returned an error during deletion");
      }
    } catch (err) {
      console.error("Clear failed", err);
    }
  };
  const loadHistory = (query) => {
    const data = JSON.parse(localStorage.getItem("offlineData")) || [];

    const filtered = data.filter(
      item => item.query === query.toLowerCase()
    );

    setHistory(filtered);
    setShowHistory(true);
  };


  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions, history]);

  useEffect(() => {
    if (handleSearchExternal) {
      handleSearchExternal(handleSearch);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setHistory([]);
      setSuggestions([]);
      setShowHistory(false); // 🔥 VERY IMPORTANT
    }
  }, []);


  return (
    <div className="relative w-full">
      <div className={`${compact ? "w-full max-w-xl" : ""}`}>

        {isOffline && (
          <div className="mb-3 px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500 text-yellow-300 text-sm text-center">
            ⚡ Offline Mode — showing saved results
          </div>
        )}
        {/* 🔍 SEARCH INPUT */}
        <div
          className="relative rounded-full border border-white/10 shadow-xl 
       transition-all duration-300 
       hover:shadow-purple-500/30 hover:scale-[1.01]
       focus-within:ring-2 focus-within:ring-purple-500/40"
          style={{ backgroundColor: "var(--card)" }}
        >
          <Search
            size={22}
            className="absolute left-6 top-1/2 -translate-y-1/2"
            style={{ color: "var(--accent)" }}
          />
          <input
            value={query}
            onFocus={() => setShowHistory(true)}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
            }}
            onKeyDown={(e) => {
              const list = suggestions.length > 0 ? suggestions : history;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) =>
                  prev < list.length - 1 ? prev + 1 : 0
                );
              }

              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) =>
                  prev > 0 ? prev - 1 : list.length - 1
                );
              }

              if (e.key === "Enter") {
                e.preventDefault();

                if (activeIndex >= 0 && list[activeIndex]) {
                  const value =
                    typeof list[activeIndex] === "string"
                      ? list[activeIndex]
                      : list[activeIndex].query;

                  setQuery(value);
                  setShowHistory(false);
                  handleSearch(value);
                } else {
                  setShowHistory(false);
                  handleSearch(query);
                }
              }

              if (e.key === "Escape") {
                setShowHistory(false);
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowHistory(false), 300);
            }}
            placeholder="Search QueryX..."
            className="w-full py-4 pl-16 pr-16 rounded-full bg-transparent outline-none"
            style={{ color: "var(--text)" }}
          />
          <Mic
            size={22}
            onClick={handleVoiceSearch}
            className={`absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer
${listening ? "animate-pulse scale-110 text-red-400" : "hover:scale-110"}`}
            style={{ color: "var(--accent)" }}
          />
        </div>
        <div className="flex justify-center mt-3">
          <button
            onClick={() => {
  const newMode = !examMode;

  setExamMode(newMode);
  if (newMode) setQuizMode(false);

  isModeChange.current = true; // 🔥 ADD THIS
}}
            className={`px-4 py-1 text-xs rounded-full transition ${examMode
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300"
              }`}
          >
            🎓 Exam Mode {examMode ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => {
  const newMode = !quizMode;

  setQuizMode(newMode);
  if (newMode) setExamMode(false);

  isModeChange.current = true; // 🔥 ADD THIS
}}
            className={`px-4 py-1 rounded-full text-xs ml-2 ${quizMode ? "bg-green-600" : "bg-gray-700"
              }`}
          >
            🧠 Quiz Mode {quizMode ? "ON" : "OFF"}
          </button>
        </div>
        {token && showHistory && (history.length > 0 || suggestions.length > 0) && (
          <div className="absolute top-full left-0 mt-2 w-full bg-black/90 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">

            <div className="flex justify-between px-4 py-2 text-sm text-gray-400 border-b border-white/10">
              {/* Dynamic Header */}
              <span>{suggestions.length > 0 ? "Suggestions" : "Recent Searches"}</span>
              {suggestions.length === 0 && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearHistory();
                  }}
                  className="hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {(suggestions.length > 0 ? suggestions : history).map((item, idx) => {
              const value = typeof item === "string" ? item : item.query;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={() => {
                    setQuery(value);
                    setShowHistory(false);
                    handleSearch(value);
                  }}
                  className={`px-4 py-3 cursor-pointer transition text-white ${idx === activeIndex
                      ? "bg-purple-600 text-white"
                      : "hover:bg-white/10"
                    }`}
                >
                  🔍 {value}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}