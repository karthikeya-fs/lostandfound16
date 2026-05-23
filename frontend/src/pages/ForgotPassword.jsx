import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();

  // phase: "email" → "otp" → "reset"
  const [phase, setPhase] = useState("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 — request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Email is required"); return; }
    try {
      setLoading(true);
      const res = await API.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      toast.success(res.data.message || "OTP sent to your email");
      if (res.data.otp) {
        setDevOtp(res.data.otp);
        setOtpDigits(res.data.otp.split(""));
        toast(`Dev OTP: ${res.data.otp}`, { icon: "🔑", duration: 8000 });
      }
      setPhase("otp");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    if (value && index < 5) {
      document.getElementById(`fp-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      document.getElementById(`fp-otp-${index - 1}`)?.focus();
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) { toast.error("Enter the complete 6-digit OTP"); return; }
    try {
      setLoading(true);
      await API.post("/auth/verify-otp", { email: email.trim().toLowerCase(), otp });
      toast.success("OTP verified. Set your new password.");
      setPhase("reset");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — reset password
  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    try {
      setLoading(true);
      const otp = otpDigits.join("");
      const res = await API.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        otp,
        password,
      });
      toast.success(res.data.message || "Password reset successfully");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-950 to-cyan-900 px-4 overflow-hidden relative">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-md p-8 text-white"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold mb-2">
            {phase === "email" && "Forgot Password"}
            {phase === "otp" && "Verify OTP"}
            {phase === "reset" && "Reset Password"}
          </h1>
          <p className="text-gray-300">
            {phase === "email" && "Enter your email to receive a reset OTP"}
            {phase === "otp" && "Enter the 6-digit code sent to your email"}
            {phase === "reset" && "Enter your new password"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {phase === "email" && (
            <motion.form
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRequestOtp}
              className="space-y-6"
            >
              <div>
                <label className="block mb-2 text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-3 rounded-xl transition duration-300 shadow-lg disabled:opacity-60"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </motion.form>
          )}

          {phase === "otp" && (
            <motion.form
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-6"
            >
              {devOtp && (
                <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-sm text-center">
                  <p className="font-bold text-xs uppercase tracking-wider text-cyan-400 mb-1">Dev OTP</p>
                  <span className="font-mono text-lg font-bold tracking-widest">{devOtp}</span>
                  <p className="text-xs text-gray-400 mt-1">Master bypass: <code className="bg-white/10 px-1 rounded">123456</code></p>
                </div>
              )}

              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`fp-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-2xl bg-white/10 border border-white/20 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition text-white"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-3 rounded-xl transition duration-300 shadow-lg disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => setPhase("email")}
                className="w-full text-sm text-gray-400 hover:text-white transition"
              >
                ← Back
              </button>
            </motion.form>
          )}

          {phase === "reset" && (
            <motion.form
              key="reset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleReset}
              className="space-y-6"
            >
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-3 rounded-xl transition duration-300 shadow-lg disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

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
