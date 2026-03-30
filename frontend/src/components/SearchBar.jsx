import { Search, Mic } from "lucide-react";
import { useState, useEffect } from "react";

export default function SearchBar({
  query, setQuery, setSearched,
  setResults, setAi, setLoading,
  setAiLoading, setIntent, compact
}) {

  const [listening, setListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // 🔍 SEARCH FUNCTION
  const handleSearch = async (customQuery) => {
    const searchQuery = customQuery || query;
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setShowDropdown(false);

    setSearched(true);
    setLoading(true);
    setAiLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();

      setResults(data.results);
      setIntent(data.intent);

      const aiRes = await fetch("http://localhost:5000/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });

      const aiData = await aiRes.json();
      setAi(aiData.answer);

    } catch {
      console.log("Error");
    }

    setLoading(false);
    setAiLoading(false);
  };

  // 🔥 FETCH SUGGESTIONS
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/suggest?q=${query}`
        );
        const data = await res.json();
        setSuggestions(data || []);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 🎤 VOICE SEARCH
  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window)) return;

    const recognition = new window.webkitSpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    let finalTranscript = "";

    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = 0; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += text;
        } else {
          interim += text;
        }
      }

      setQuery(finalTranscript + interim);
    };

    recognition.onend = () => {
      setListening(false);

      if (finalTranscript.trim()) {
        handleSearch(finalTranscript);
      }
    };
  };

  return (
    <div className={compact ? "w-full max-w-[650px]" : "w-full max-w-[750px]"}>

      {/* SEARCH BOX */}
      <div className="relative">

        <div className="
          flex items-center
          bg-white/5 backdrop-blur-lg
          border border-white/10
          rounded-full px-5 py-3
          shadow-lg
          focus-within:shadow-[0_0_25px_rgba(122,92,255,0.5)]
        ">

          <Search
            size={20}
            onClick={() => handleSearch()}
            className="text-white/60 cursor-pointer"
          />

          <input
            value={query}
            onFocus={() => suggestions.length && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (activeIndex >= 0) {
                  handleSearch(suggestions[activeIndex]);
                } else {
                  handleSearch();
                }
              }

              if (e.key === "ArrowDown") {
                setActiveIndex((prev) =>
                  prev < suggestions.length - 1 ? prev + 1 : 0
                );
              }

              if (e.key === "ArrowUp") {
                setActiveIndex((prev) =>
                  prev > 0 ? prev - 1 : suggestions.length - 1
                );
              }
            }}
            placeholder="Search QueryX..."
            className="flex-1 mx-3 bg-transparent outline-none text-white"
          />

          <Mic
            size={20}
            onClick={startVoice}
            className={`cursor-pointer ${
              listening ? "text-red-400 animate-pulse" : "text-white/60"
            }`}
          />
        </div>

        {/* 🔥 DROPDOWN */}
        {showDropdown && suggestions.length > 0 && (
          <div className="
            absolute w-full mt-2
            bg-[#1e1e1e]/90 backdrop-blur-xl
            border border-white/10
            rounded-xl shadow-xl
            overflow-hidden animate-dropdown
          ">

            {suggestions.map((item, i) => (
              <div
                key={i}
                onMouseDown={() => handleSearch(item)}
                className={`
                  px-4 py-3 cursor-pointer flex items-center gap-3
                  ${i === activeIndex ? "bg-white/10" : "hover:bg-white/5"}
                `}
              >
                🔍 {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {listening && (
        <p className="text-center text-sm mt-2 text-red-400 animate-pulse">
          🎤 Listening...
        </p>
      )}

    </div>
  );
}