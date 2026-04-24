import { useEffect, useState } from "react";
import qxLogo from "../assets/qx-logo.png";
import AuthModal from "./AuthModal";

export default function Header({
  theme,
  setTheme,
  children,
  searchType,
  setSearchType,
  searched
}) {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    localStorage.removeItem("offlineData");
  localStorage.removeItem("aiData");

  window.location.reload();
  };



  return (
    <>
      <header
        className="
          w-full px-2.5 py-3 fixed top-0 left-0 z-20
          backdrop-blur-md bg-white/5
          border-b border-white/10
        "
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
      >
        <div className="w-full sm:px-6 ">

          <div className="grid grid-cols-[auto_1fr_auto] items-center w-full">


            {/* LOGO */}
            <div className="flex items-center">
              <img
                src={qxLogo}
                alt="QX Logo"
                className="h-8 sm:h-10 mr-4 scale-185"
              />
            </div>

            {/* SEARCH (CENTER COLUMN) */}
            <div className="flex justify-center px-2">
              <div className="w-full ml-50 max-w-[600px]">
                {children}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-2 sm:gap-4 justify-end">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10"
              >
                {theme === "dark" ? "🌑" : "☀️"}
              </button>

              {user ? (
                <>
                  <span className="hidden sm:block text-sm">
                    Hi, {user.name}
                  </span>

                  <button
                    onClick={handleLogout}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-red-500 text-white text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-white text-sm"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  Login
                </button>
              )}
            </div>
          </div>
          {searched && (
  <div className="flex justify-center mt-3">
    <div className="w-full max-w-[600px] flex justify-center ">

      <div className="flex gap-8 text-sm">
        {["all", "images", "videos"].map(type => (
          <button
            key={type}
            onClick={() => setSearchType(type)}
            className={`capitalize pb-1 ${
              searchType === type
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

    </div>
  </div>
)}

        </div>
      </header >

      {showAuth && (
        <AuthModal setUser={setUser} onClose={() => setShowAuth(false)} />
      )
      }
    </>
  );
}