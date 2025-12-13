import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginadminReader } from "../api/api.js";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function MeterReaderLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    try {
      const res = await loginadminReader({ username, password });

      if (res.data?.success) {
        if (res.data?.role !== "meter_reader") {
          setError("Access denied. This page is for meter readers only.");
          return;
        }

        setSuccess("Login successful!");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("name", res.data.name);
        localStorage.setItem("id", res.data.id);

        navigate("/reader-dashboard");
      } else {
        setError(res.data?.message || "Login failed. Check credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <div className="bg-gray-950 shadow-lg rounded-3xl p-8 sm:p-12 w-full max-w-md text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-blue-400">
          Meter Reader Login
        </h2>

        {error && <p className="text-red-400 mb-4 font-semibold">{error}</p>}
        {success && <p className="text-green-400 mb-4 font-semibold">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Username */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">Username</label>
            <input
              type="text"
              className="w-full border border-blue-500/50 rounded-xl px-3 py-2 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password with show/hide */}
          <div className="relative">
            <label className="block text-gray-300 font-semibold mb-2">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border border-blue-500/50 rounded-xl px-3 py-2 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white mt-4"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-2xl font-semibold shadow-sm transition-transform hover:scale-105 text-white mt-2"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
