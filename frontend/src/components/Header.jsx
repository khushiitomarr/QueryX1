import { useEffect, useState } from "react";
import qxLogo from "../assets/qx-logo.png";
import AuthModal from "./AuthModal";
import { LogOut, X } from "lucide-react";

export default function Header({
  theme,
  setTheme,
  children,
  searchType,
  setSearchType,
  searched,
  onHomeClick
}) {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
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
          app-header
          w-full px-3 py-2 fixed top-0 left-0 z-20
          backdrop-blur-md bg-white/5
          border-b border-white/10
        "
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
      >
        <div className="w-full sm:px-5">

          <div className="grid grid-cols-[170px_minmax(280px,1fr)_auto] items-start gap-4 w-full">


            {/* LOGO */}
            <div className="flex items-center pt-2">
             <img
  src={qxLogo}
  alt="QX Logo"
  onClick={onHomeClick}
  className="h-14 sm:h-16 cursor-pointer transition hover:scale-105"
/>
            </div>

            {/* SEARCH (CENTER COLUMN) */}
            <div className="flex justify-center">
              <div className="w-full max-w-[580px]">
                {children}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-2 sm:gap-4 justify-end pt-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="theme-toggle w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10"
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
  <div className="flex justify-center mt-2">
    <div className="w-full max-w-[600px] flex items-center justify-center gap-6">

      {/* FILTERS */}
      <div className="flex gap-6 text-sm">
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

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center px-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl"
            style={{ backgroundColor: "var(--card)", color: "var(--text)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
              aria-label="Close logout confirmation"
            >
              <X size={20} />
            </button>

            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.16)", color: "#f87171" }}
            >
              <LogOut size={21} />
            </div>

            <h2 className="text-xl font-bold">Logout?</h2>
            <p className="mt-2 text-sm text-gray-300">
              Your account session will close on this device.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
