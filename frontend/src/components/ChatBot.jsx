import { useState, useEffect} from "react";

export default function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

useEffect(() => {
  const goOffline = () => setIsOffline(true);
  const goOnline = () => setIsOffline(false);

  window.addEventListener("offline", goOffline);
  window.addEventListener("online", goOnline);

  return () => {
    window.removeEventListener("offline", goOffline);
    window.removeEventListener("online", goOnline);
  };
}, []);

const getOfflineResponse = (query) => {
  query = query.toLowerCase().trim();

  // 🔹 1. AI CACHE FIRST (BEST MATCH)
  const aiCache = JSON.parse(localStorage.getItem("aiData")) || [];

  const aiMatch = aiCache.find(item =>
    query.includes(item.query.toLowerCase())
  );

  if (aiMatch) return aiMatch.ai;

  // 🔹 2. SEARCH CACHE
  const offline = JSON.parse(localStorage.getItem("offlineData")) || [];

  const match = offline.find(item =>
    query.includes(item.query.toLowerCase())
  );

  if (match) {
    return `Here’s what I found about "${query}":\n\n${match.results[0]?.title}`;
  }

  // 🔹 3. GREETING (STRICT MATCH ONLY)
  if (query === "hello" || query === "hi" || query === "hey") {
    return "Hey! I'm working offline but still here 😎";
  }

  // 🔹 4. DEFAULT
  return "⚡ I'm offline right now. Try again when internet is back.";
};

  const sendMessage = async () => {
    if (!input.trim()) return;
    // 🚀 OFFLINE MODE
if (isOffline) {
  const userMessage = { role: "user", content: input };

  const botReply = getOfflineResponse(input);

  setMessages(prev => [
    ...prev,
    userMessage,
    { role: "assistant", content: botReply }
  ]);

  setInput("");
  setLoading(false);
  return; // ❗ STOP API CALL
}

    const userMessage = { role: "user", content: input };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedMessages // ✅ FIXED
        })
      });

      const data = await res.json();

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: data.reply || "No response" }
      ]);
    } catch (err) {
      console.error("FRONTEND ERROR:", err);

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "⚡ Offline or server error. Try again later." }
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-xl border border-white/10 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="font-semibold">💬 AI Chat</h2>

       <button
  onClick={() => window.close()}
  className="text-gray-400 hover:text-white"
>
  ✖
</button>
      </div>
      {/* CHAT BOX */}
      <div className="h-150 overflow-y-auto rounded-xl p-4 border border-white/10 bg-black/40 space-y-3">
        {messages.slice(1).map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-full ${msg.role === "user"
                ? "ml-auto bg-purple-500/20"
                : "bg-white/10"
              }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <p className="opacity-60 animate-pulse">Typing...</p>
        )}
      </div>

      {/* INPUT */}
      <div className="flex gap-2 p-3 border-t border-white/10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask anything..."
          className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none"
        />

        <button
          onClick={sendMessage}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700"
        >
          Send
        </button>
      </div>
      
    </div>

  );
}