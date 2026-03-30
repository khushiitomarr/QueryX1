import {
  Github,
  Linkedin,
  Twitter,
  Instagram,
  MessageCircle,
} from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="
        w-full mt-10 px-4 py-5
        border-t border-white/10
        backdrop-blur-md bg-white/5
      "
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {/* SOCIAL */}
        <div className="flex gap-4 opacity-60">

  {/* GitHub */}
  <a 
    href="https://github.com/your-username"
    target="_blank"
    rel="noreferrer"
    className="hover:scale-110 transition"
  >
    <Github size={20} />
  </a>

  {/* LinkedIn */}
  <a 
    href="https://linkedin.com/in/your-username"
    target="_blank"
    rel="noreferrer"
    className="hover:scale-110 transition"
  >
    <Linkedin size={20} />
  </a>

  {/* Twitter (X) */}
  <a 
    href="https://twitter.com/your-username"
    target="_blank"
    rel="noreferrer"
    className="hover:scale-110 transition"
  >
    <Twitter size={20} />
  </a>

  {/* Instagram */}
  <a 
    href="https://instagram.com/your-username"
    target="_blank"
    rel="noreferrer"
    className="hover:scale-110 transition"
  >
    <Instagram size={20} />
  </a>

  {/* WhatsApp */}
  <a 
    href="https://wa.me/919876543210"
    target="_blank"
    rel="noreferrer"
    className="hover:scale-110 transition hover:text-green-400"
  >
    <MessageCircle size={20} />
  </a>

</div>

        {/* COPYRIGHT */}
        <p className="text-xs opacity-40">
          © {new Date().getFullYear()} QueryX
        </p>
      </div>
    </footer>
  );
}
