import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AIDetail from "./pages/AIDetail";
import ChatMain from "./pages/ChatMain"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/ai" element={<AIDetail />} />
        <Route path="/search" element={<App />} />
        <Route path="/chat" element={<ChatMain/>}/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);