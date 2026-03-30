import ReactMarkdown from "react-markdown";

export default function AIDetail() {
  const ai = localStorage.getItem("aiData");

  return (
    <div className="p-10">
      <ReactMarkdown>{ai}</ReactMarkdown>
    </div>
  );
}