import { useEffect, useState } from "react";
import qxLogo from "../assets/qx-logo.png";
import AuthModal from "./AuthModal";

export default function Header({ theme, setTheme, children }) {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    if (token && name) setUser(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setUser(null);
  };

  return (
    <>
      <header
        className="
          w-full px-8 py-4 fixed top-0 left-0 z-20
          backdrop-blur-md bg-white/5
          border-b border-white/10
        "
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-6">
          {/* LOGO */}
          <img
            src={qxLogo}
            alt="QX Logo"
            className="h-24 pointer-events-none select-none"
          />

          {/* SEARCH BAR SLOT */}
          <div className="flex-1">{children}</div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            {/* THEME */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 rounded-full bg-white/10"
            >
              {theme === "dark" ? "🌑" : "☀️"}
            </button>

            {/* AUTH */}
            {user ? (
              <>
                <span className="text-sm">Hi, {user}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full bg-red-500 text-white text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="px-5 py-2 rounded-full text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Login / Signup
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal setUser={setUser} onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}
