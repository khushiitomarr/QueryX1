import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AuthModal({ onClose, setUser }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url =
      mode === "login"
        ? "http://localhost:5000/api/auth/login"
        : "http://localhost:5000/api/auth/signup";

    const body =
      mode === "login"
        ? { email, password }
        : { name, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      window.location.reload();
      onClose();
    } catch {
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center animate-fadeIn">
      <div
        className="relative w-[380px] rounded-2xl p-8 border border-white/10 shadow-xl animate-scaleIn"
        style={{ backgroundColor: "var(--card)", color: "var(--text)" }}
      >
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X size={22} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              placeholder="Full Name"
              required
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            required
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              required
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input pr-12"
            />

            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          {/* BUTTON */}
          <button
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition active:scale-95"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* SWITCH */}
        <p className="text-center text-sm mt-4">
          {mode === "login" ? (
            <span
              onClick={() => setMode("signup")}
              className="cursor-pointer"
              style={{ color: "var(--accent)" }}
            >
              Create account
            </span>
          ) : (
            <span
              onClick={() => setMode("login")}
              className="cursor-pointer"
              style={{ color: "var(--accent)" }}
            >
              Already have an account?
            </span>
          )}
        </p>
      </div>
    </div>
  );
}