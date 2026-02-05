import qxLogo from "../assets/qx-logo.png";
import {
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  MessageCircle
} from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="mt-10 px-6 py-6 transition-colors"
      style={{ backgroundColor: "var(--card)" }}
    >
      {/* CENTER: QUICK LINKS + SOCIAL */}
<div className="flex flex-col items-center text-center">

  {/* SOCIAL ICONS (NEXT LINE, CENTERED) */}
  {/* SOCIAL ICONS */}
<div className="flex gap-5 opacity-60">
  <a
    href="https://github.com/"
    target="_blank"
    rel="noreferrer"
    className="hover:opacity-100 hover:scale-110 transition"
    style={{ color: "var(--text)" }}
  >
    <Github size={20} />
  </a>

  <a
    href="https://linkedin.com/"
    target="_blank"
    rel="noreferrer"
    className="hover:opacity-100 hover:scale-110 transition"
    style={{ color: "var(--text)" }}
  >
    <Linkedin size={20} />
  </a>

  <a
    href="https://twitter.com/"
    target="_blank"
    rel="noreferrer"
    className="hover:opacity-100 hover:scale-110 transition"
    style={{ color: "var(--text)" }}
  >
    <Twitter size={20} />
  </a>

  <a
    href="https://instagram.com/"
    target="_blank"
    rel="noreferrer"
    className="hover:opacity-100 hover:scale-110 transition"
    style={{ color: "var(--text)" }}
  >
    <Instagram size={20} />
  </a>

  <a
    href="https://facebook.com/"
    target="_blank"
    rel="noreferrer"
    className="hover:opacity-100 hover:scale-110 transition"
    style={{ color: "var(--text)" }}
  >
    <Facebook size={20} />
  </a>

  <a
    href="https://wa.me/XXXXXXXXXX"
    target="_blank"
    rel="noreferrer"
    className="hover:opacity-100 hover:scale-110 transition"
    style={{ color: "var(--text)" }}
  >
    <MessageCircle size={20} />
  </a>
</div>

</div>


      {/* BOTTOM LINE */}
      <div className="mt-6 pt-4 text-center text-xm opacity-50 ">
        © {new Date().getFullYear()} QueryX. All rights reserved.
      </div>
    </footer>
  );
}
