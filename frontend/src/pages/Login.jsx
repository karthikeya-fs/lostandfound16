import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../services/api";
import { setAuthSession } from "../utils/authStorage";
import FormLayout from "../components/FormLayout";
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiUserPlus, FiShield } from "react-icons/fi";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
};

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP step state
  const [phase, setPhase] = useState("credentials"); // "credentials" | "otp"
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1 — verify credentials, trigger OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (res.data.requireOtp) {
        toast.success(res.data.message || "OTP sent to your email");
        if (res.data.otp) {
          setDevOtp(res.data.otp);
          setOtpDigits(res.data.otp.split(""));
          toast(`Dev OTP: ${res.data.otp}`, { icon: "🔑", duration: 8000 });
        }
        setPhase("otp");
      } else {
        // Fallback: if backend returns token directly (shouldn't happen now)
        setAuthSession({ token: res.data.token, user: res.data.user });
        toast.success("Login Successful ✅");
        navigate("/home");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // OTP digit input handler
  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    if (value && index < 5) {
      document.getElementById(`login-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      document.getElementById(`login-otp-${index - 1}`)?.focus();
    }
  };

  // Step 2 — verify OTP, get JWT
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    try {
      setLoading(true);
      const res = await API.post("/auth/login/verify-otp", {
        email: formData.email.trim().toLowerCase(),
        otp,
      });
      setAuthSession({ token: res.data.token, user: res.data.user });
      toast.success("Login Successful ✅");
      navigate("/home");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const res = await API.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      toast.success(res.data.message || "OTP resent");
      if (res.data.otp) {
        setDevOtp(res.data.otp);
        setOtpDigits(res.data.otp.split(""));
        toast(`Dev OTP: ${res.data.otp}`, { icon: "🔑", duration: 8000 });
      } else {
        setOtpDigits(["", "", "", "", "", ""]);
        setDevOtp("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      title={phase === "otp" ? "Verify Login OTP" : "Welcome back"}
      subtitle={phase === "otp" ? "Enter the 6-digit code sent to your email" : "Sign in with your email"}
      icon={phase === "otp" ? <FiShield /> : <FiLogIn />}
    >
      <AnimatePresence mode="wait">
        {phase === "credentials" && (
          <motion.form
            key="credentials"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit}
            className="form-stack"
          >
            <motion.div variants={itemVariants} className="form-field">
              <label htmlFor="email">Email</label>
              <div className="form-input-wrap">
                <FiMail className="form-input-icon" aria-hidden />
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="form-field">
              <label htmlFor="password">Password</label>
              <div className="form-input-wrap">
                <FiLock className="form-input-icon" aria-hidden />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input form-input-has-toggle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="form-input-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="form-actions-end">
              <Link to="/forgot-password" className="form-link">
                Forgot password?
              </Link>
            </motion.div>

            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              className="form-btn-primary"
            >
              {loading ? "Sending OTP..." : "Sign in"}
              <FiLogIn aria-hidden />
            </motion.button>
          </motion.form>
        )}

        {phase === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {devOtp && (
              <div className="mb-5 p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-sm text-center">
                <p className="font-bold text-xs uppercase tracking-wider text-cyan-400 mb-1">Dev OTP</p>
                <span className="font-mono text-lg font-bold tracking-widest">{devOtp}</span>
                <p className="text-xs text-gray-400 mt-1">Master bypass: <code className="bg-white/10 px-1 rounded">123456</code></p>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="form-stack">
              <div className="flex justify-center gap-2 mb-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`login-otp-${index}`}
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
                className="form-btn-primary mt-4"
              >
                {loading ? "Verifying..." : "Verify & Login"}
                <FiShield aria-hidden />
              </button>

              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => setPhase("credentials")}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, type: "spring", stiffness: 350, damping: 25 }}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.97 }}
      >
        <Link to="/register" className="form-btn-secondary form-external-actions">
          <FiUserPlus aria-hidden />
          Create account
        </Link>
      </motion.div>
    </FormLayout>
  );
}

export default Login;
