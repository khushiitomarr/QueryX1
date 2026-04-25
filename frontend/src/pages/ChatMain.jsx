import React from "react";
import ReactDOM from "react-dom/client";
import ChatBot from "../components/ChatBot";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <ChatBot />
    </div>
  </React.StrictMode>
);