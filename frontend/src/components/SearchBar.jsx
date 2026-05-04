import { Mic, Search } from "lucide-react";
import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect } from "react";
import { getApiUrl, getAuthHeaders } from "../utils/api";

const getModeName = ({ examMode, quizMode }) => {
  if (quizMode) return "quiz";
  if (examMode) return "exam";
  return "normal";
};

const getStudentAiQuery = (query, difficultyLevel, followUpInstruction) =>
  [
    query,
    difficultyLevel ? `Explain for a ${difficultyLevel} student.` : "",
    followUpInstruction,
  ]
    .filter(Boolean)
    .join("\n\n");

const getAiCacheMode = (mode, difficultyLevel, followUpInstruction) =>
  [mode, difficultyLevel || "standard", followUpInstruction || "default"].join(":");

const getCachedAiEntry = (cache, storageKey, mode) => {
  const modes = Array.isArray(mode) ? mode.filter(Boolean) : [mode].filter(Boolean);
  const matchesQuery = item => item.query?.toLowerCase() === storageKey;
  const exactMatch = cache.find(
    item => matchesQuery(item) && modes.includes(item.mode)
  );

  if (exactMatch) return exactMatch;

  const baseModes = modes.map(item => String(item).split(":")[0]);
  return cache.find(
    item =>
      matchesQuery(item) &&
      baseModes.some(baseMode => item.mode === baseMode || item.mode?.startsWith(`${baseMode}:`))
  );
};

const getCachedAi = (cache, storageKey, mode) =>
  getCachedAiEntry(cache, storageKey, mode)?.ai || "";

const getCachedSearch = (storageKey) => {
  const offline = JSON.parse(localStorage.getItem("offlineData")) || [];

  return offline.find(
    item =>
      item.query?.toLowerCase() === storageKey ||
      item.query?.toLowerCase().includes(storageKey)
  );
};

const getOfflineHistoryItems = () => {
  const offline = JSON.parse(localStorage.getItem("offlineData")) || [];

  return offline
    .filter(item => item?.query)
    .map(item => ({ query: item.query, results: item.results || [] }));
};

const getSourceSentences = (text, limit = 4) =>
  String(text || "")
    .replace(/[#*_`>-]/g, " ")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 20)
    .slice(0, limit);

const buildOfflineExamAnswer = (query, storageKey, cachedAi) => {
  const normalAi = getCachedAi(cachedAi, storageKey, "normal");
  const cachedSearch = getCachedSearch(storageKey);
  const resultText = (cachedSearch?.results || [])
    .slice(0, 4)
    .map(result => `${result.title}. ${result.description}`)
    .join(" ");

  const points = getSourceSentences(normalAi || resultText, 4);
  const definition = points[0] || `${query} is the topic saved from your offline search results.`;

  return `
## Key Points
${points.length
      ? points.map(point => `- ${point}`).join("\n")
      : `- ${query} is available from your saved offline search results.`
    }

## Definition
- ${definition}

## Important Questions
- What is ${query}?
- Why is ${query} important?
- What are the main features or uses of ${query}?

## Quick Revision
- Read the key points once.
- Remember the definition in your own words.
- Revise the important questions before the exam.
`.trim();
};

const buildOfflineNormalAnswer = (query, storageKey, cachedAi) => {
  const normalAi = getCachedAi(cachedAi, storageKey, "normal");
  if (normalAi) return normalAi;

  const cachedSearch = getCachedSearch(storageKey);
  const savedResults = (cachedSearch?.results || []).slice(0, 5);
  const resultText = savedResults
    .map(result => `${result.title}. ${result.description}`)
    .join(" ");
  const points = getSourceSentences(resultText, 5);

  if (!savedResults.length && !points.length) return "";

  return `
## Overview

${points[0] || `${query} is available from your saved offline search results.`}

## Key Points
${points.length
      ? points.map(point => `- ${point}`).join("\n")
      : savedResults.map(result => `- ${result.title}`).join("\n")
    }

## Saved Sources
${savedResults
      .slice(0, 3)
      .map(result => `- ${result.title}`)
      .join("\n")}
`.trim();
};

const getOfflineAiAnswer = (query, storageKey, mode, cachedAi, baseMode = mode) => {
  const cachedAnswer = getCachedAi(cachedAi, storageKey, [mode, baseMode]);
  if (cachedAnswer) return cachedAnswer;

  const offlineMode = String(baseMode || mode).split(":")[0];

  if (offlineMode === "exam") {
    return buildOfflineExamAnswer(query, storageKey, cachedAi);
  }

  if (offlineMode === "normal") {
    return buildOfflineNormalAnswer(query, storageKey, cachedAi);
  }

  return "";
};

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
  difficultyLevel = "Class 10",
  followUpInstruction = "",
  clearFollowUpInstruction,
  searchType = "all",
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const debounceRef = useRef(null);
  const aiMemoryCache = useRef({});
  const aiRequestRef = useRef(0);

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
    fetchHistory(); // always try, but use saved searches while offline
  }, [isOffline]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    fetchSuggestions(query);
  }, [query]);

  const fetchSuggestions = (text) => {
    if (isOffline) {
      const filtered = getOfflineHistoryItems()
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
        const res = await fetch(getApiUrl(`/api/suggest/suggestions?q=${encodeURIComponent(text)}`));

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

  };

  const fetchHistory = async () => {
    console.log("Fetching history...");
    try {
      const token = localStorage.getItem("token");

      if (isOffline || !token) {
        setHistory(getOfflineHistoryItems());
        return;
      }

      const res = await fetch(getApiUrl("/api/search/history"), {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      console.log("History response:", data);
      setHistory(data);
    } catch (err) {
      console.error(err);
      setHistory(getOfflineHistoryItems());
    }
  };

  const handleSearch = async (customQuery, page = 1) => {

    const finalQuery = typeof customQuery === "string"
      ? customQuery.trim()
      : (query || "").trim();
    sessionStorage.setItem("lastQuery", finalQuery);
    sessionStorage.setItem("searched", "true");
    const storageKey = finalQuery.toLowerCase();

    const cache = JSON.parse(localStorage.getItem("offlineData")) || [];
    const cached =
      cache.find(item => item.query.toLowerCase().includes(storageKey));

    if (cached && page === 1) {
      setResults(cached.results); // ⚡ instant result
    }
    const aiCache = JSON.parse(localStorage.getItem("aiData")) || [];

    const baseMode = quizMode
      ? "quiz"
      : examMode
        ? "exam"
        : "normal";
    const currentMode = getAiCacheMode(baseMode, difficultyLevel, followUpInstruction);
    console.log("🔥 Sending mode:", currentMode);

    const aiMatch = getCachedAiEntry(aiCache, storageKey, [currentMode, baseMode]);

    if (aiMatch && page === 1 && !isModeChange.current) {
      setAi(aiMatch.ai);
      setAiLoading(false);
    }
    if (!finalQuery || searchingRef.current) return;
    clearedRef.current = false;

    if (isOffline) {
      setSearched(true);
      setShowHistory(false);
      setLoading(false);
      setAiLoading(false);

      if (cached && page === 1) {
        setResults(cached.results);
      }

      const offlineAi = getOfflineAiAnswer(
        finalQuery,
        storageKey,
        currentMode,
        aiCache,
        baseMode
      );

      setAi(offlineAi || "⚡ No AI available offline");
      return;
    }

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
      if (searchType === "images") {
        const imgRes = await fetch(getApiUrl(`/api/images?q=${encodeURIComponent(finalQuery)}`));
        const imgData = await imgRes.json();
        setImages(imgData.images || []);
        setAiLoading(false);
        return;
      }

      if (searchType === "videos") {
        const vidRes = await fetch(getApiUrl(`/api/videos?q=${encodeURIComponent(finalQuery)}`));
        const vidData = await vidRes.json();
        setVideos(vidData.videos || []);
        setAiLoading(false);
        return;
      }

      const searchPromise = fetch(
        getApiUrl(`/api/search?q=${encodeURIComponent(finalQuery)}&page=${page}`),
        {
          headers: getAuthHeaders(),
          signal: controllerRef.current.signal,
        }
      );

      const searchRes = await searchPromise;

      // 🔥 AI separate
      let aiData = null;

      if (!isOffline || examMode || quizMode) {
        try {
          const baseMode = quizMode
            ? "quiz"
            : examMode
              ? "exam"
              : "normal";
          const currentMode = getAiCacheMode(baseMode, difficultyLevel, followUpInstruction);
          const aiQuery = getStudentAiQuery(finalQuery, difficultyLevel, followUpInstruction);

          const aiRes = await fetch(getApiUrl("/api/ai"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders()
            },
            body: JSON.stringify({
              query: aiQuery,
              mode: baseMode
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
    clearFollowUpInstruction?.();
  };

  const fetchAiForMode = async (searchText, mode) => {
    const finalQuery = (searchText || "").trim();
    if (!finalQuery) return;

    const requestId = ++aiRequestRef.current;
    const storageKey = finalQuery.toLowerCase();
    const currentMode = getAiCacheMode(mode, difficultyLevel, followUpInstruction);
    const cachedAi = JSON.parse(localStorage.getItem("aiData")) || [];
    const cachedMatch = getCachedAiEntry(cachedAi, storageKey, [currentMode, mode]);

    sessionStorage.setItem("lastQuery", finalQuery);
    sessionStorage.setItem("searched", "true");
    setSearched(true);
    setAi("");
    setAiLoading(true);
    setShowHistory(false);

    try {
      if (isOffline) {
        const offlineAi =
          cachedMatch?.ai ||
          getOfflineAiAnswer(finalQuery, storageKey, currentMode, cachedAi, mode);

        setAi(offlineAi || "⚡ No AI available offline");
        return;
      }

      const aiQuery = getStudentAiQuery(finalQuery, difficultyLevel, followUpInstruction);

      const aiRes = await fetch(getApiUrl("/api/ai"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          query: aiQuery,
          mode
        })
      });

      const aiData = await aiRes.json();
      if (requestId !== aiRequestRef.current) return;

      if (aiData?.answer) {
        setAi(aiData.answer);

        const nextCache = cachedAi.filter(
          item => !(item.query.toLowerCase() === storageKey && item.mode === currentMode)
        );

        nextCache.unshift({
          query: storageKey,
          mode: currentMode,
          ai: aiData.answer
        });

        localStorage.setItem("aiData", JSON.stringify(nextCache.slice(0, 50)));
      } else {
        setAi("AI failed");
      }
    } catch (err) {
      console.log("AI mode fetch failed", err);
      if (requestId === aiRequestRef.current) {
        setAi(cachedMatch?.ai || "AI failed");
      }
    } finally {
      if (requestId === aiRequestRef.current) {
        setAiLoading(false);
      }
    }
  };

  const handleModeToggle = (mode) => {
    const nextExamMode = mode === "exam" ? !examMode : false;
    const nextQuizMode = mode === "quiz" ? !quizMode : false;
    const nextMode = getModeName({
      examMode: nextExamMode,
      quizMode: nextQuizMode,
    });

    if (isModeChange) isModeChange.current = false;

    setExamMode(nextExamMode);
    setQuizMode(nextQuizMode);
    fetchAiForMode(query, nextMode);
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

      if (!token) {
        localStorage.removeItem("offlineData");
        clearedRef.current = true;
        setHistory([]);
        setShowHistory(false);
        return;
      }

      const res = await fetch(getApiUrl("/api/search/history"), {
        method: "DELETE",
        headers: getAuthHeaders()
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
      handleSearchExternal(() => handleSearch);
    }
  }, [searchType, examMode, quizMode, difficultyLevel, followUpInstruction, isOffline]);

  useEffect(() => {
    if (!followUpInstruction || !query.trim()) return;
    handleSearch(query);
  }, [followUpInstruction]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setHistory(getOfflineHistoryItems());
      setSuggestions([]);
      setShowHistory(false); // 🔥 VERY IMPORTANT
    }
  }, [isOffline]);


  return (
    <div className="relative w-full">
      <div className={`relative ${compact ? "mx-auto w-full max-w-xl" : ""}`}>

        {isOffline && (
          <div className="mb-3 px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500 text-yellow-300 text-sm text-center">
            ⚡ Offline Mode — showing saved results
          </div>
        )}
        {/* 🔍 SEARCH INPUT */}
        <div
          className="queryx-search-shell relative rounded-full border border-white/10 shadow-xl 
       transition-all duration-300 
       focus-within:ring-2 focus-within:ring-blue-500/30"
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
            className={`queryx-search-input w-full pl-16 pr-16 rounded-full bg-transparent outline-none ${compact ? "py-3" : "py-3"}`}
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
        <div className={`queryx-mode-switch mx-auto flex items-center justify-center gap-1 ${compact ? "mt-2" : "mt-3"}`}>
          <button
            onClick={() => handleModeToggle("exam")}
            aria-pressed={examMode}
            className={`mode-button ${examMode
              ? "mode-active exam-active"
              : ""
              }`}
          >
            🎓 Exam Mode {examMode ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => handleModeToggle("quiz")}
            aria-pressed={quizMode}
            className={`mode-button ${quizMode
              ? "mode-active quiz-active"
              : ""
              }`}
          >
            🧠 Quiz Mode {quizMode ? "ON" : "OFF"}
          </button>
        </div>
        {showHistory && (history.length > 0 || suggestions.length > 0) && (
          <div className="search-history-dropdown absolute top-full left-0 right-0 mt-2 w-full backdrop-blur-lg border rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">

            <div className="search-history-header flex justify-between px-4 py-2 text-sm border-b">
              {/* Dynamic Header */}
              <span>{suggestions.length > 0 ? "Suggestions" : "Recent Searches"}</span>
              {suggestions.length === 0 && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearHistory();
                  }}
                  className="search-history-clear"
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
                  className={`search-history-item px-4 py-3 cursor-pointer transition ${idx === activeIndex
                    ? "search-history-item-active"
                    : ""
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
