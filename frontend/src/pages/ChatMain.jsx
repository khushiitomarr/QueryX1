import ChatBot from "../components/ChatBot";
import "../index.css";

export default function ChatMain() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <ChatBot />
    </div>
  );
}