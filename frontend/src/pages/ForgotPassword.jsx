import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import API from "../services/api";

function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const resetEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(resetEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isResetMode = Boolean(resetToken);

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/forgot-password", { email });
      toast.success(res.data.message || "Reset link sent to your email");
      if (res.data.resetLink) {
        toast(`Dev link: ${res.data.resetLink}`, { duration: 8000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      const res = await API.post("/auth/reset-password", {
        token: resetToken,
        email: email.trim().toLowerCase(),
        password,
      });
      toast.success(res.data.message || "Password reset successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-black via-blue-950 to-cyan-900 px-4 overflow-hidden relative">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-md p-8 text-white"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold mb-2">
            {isResetMode ? "Reset Password" : "Forgot Password"}
          </h1>
          <p className="text-gray-300">
            {isResetMode
              ? "Enter your new password"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        <form onSubmit={isResetMode ? handleReset : handleForgot} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isResetMode && !!resetEmail}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
            />
          </div>

          {isResetMode && (
            <>
              <div>
                <label className="block mb-2 text-sm font-medium">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-3 rounded-xl transition duration-300 shadow-lg"
          >
            {isResetMode ? "Update password" : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-300 mt-6">
          <Link to="/login" className="text-cyan-300 hover:text-white hover:underline">
            Back to Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
