import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginadminReader } from "../api/api.js";

export default function MeterReaderLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      console.log("Backend response:", res.data);

      if (res.data?.success) {
        // ROLE CHECK
        if (res.data?.role !== "meter_reader") {
          setError("Access denied. This page is for meter readers only.");
          return;
        }

        setSuccess("Login successful!");

        // Store token and role in localStorage
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("name", res.data.name);
        localStorage.setItem("id", res.data.id);

        // Redirect to meter reader dashboard
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Meter Reader Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-semibold text-center">
              {error}
            </p>
          )}

          {success && (
            <p className="text-green-600 text-sm font-semibold text-center">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold py-2 rounded hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form>
      </div>

      <div className="absolute bottom-4 text-center text-sm w-full">
        <nav className="space-x-3">
          <Link to="/landing-page" className="text-blue-700 hover:underline">
            Home
          </Link>
          <span>|</span>
          <Link to="/admin-login" className="text-blue-700 hover:underline">
            Admin
          </Link>
          <span>|</span>
          <Link to="/resident-login" className="text-blue-700 hover:underline">
            Resident
          </Link>
          <span>|</span>
          <Link to="/meter-reader" className="text-blue-700 hover:underline">
            Meter Reader
          </Link>
        </nav>
      </div>
    </div>
  );
}
