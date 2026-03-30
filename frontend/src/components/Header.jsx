import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";

export default function Header({ theme, setTheme, children }) {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    if (token && name) setUser(name);
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <>
      <header
        className="
          fixed top-0 left-0 w-full z-50
          backdrop-blur-xl bg-white/5
          border-b border-white/10
        "
      >
        <div className="w-full px-6 py-3 flex items-center justify-between">

          {/* LEFT LOGO */}
         <img 
  src="/src/assets/qx-logo.png" 
  className="h-16 w-auto object-contain scale-350 origin-left"
/>
        

          {/* CENTER SEARCH */}
          <div className="w-full max-w-[600px] hidden md:block">
            {children}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">

            {/* THEME BUTTON */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>

            {/* USER */}
            {user ? (
              <>
                <span className="text-sm hidden sm:block">
                  Hi, {user}
                </span>

                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-full bg-red-500 text-white text-sm hover:bg-red-600"
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
                Login
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