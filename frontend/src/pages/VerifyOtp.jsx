import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../services/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 20 },
  },
};

function readRegisterData() {
  try {
    const raw = localStorage.getItem("registerData");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function VerifyOTP() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState("");

  // Check for fallback/dev OTP on mount
  useEffect(() => {
    const fallbackOtp = localStorage.getItem("devOTP");
    if (fallbackOtp && fallbackOtp.length === 6) {
      setIsDevMode(true);
      setDevOtpCode(fallbackOtp);
      setOtp(fallbackOtp.split(""));
    }
  }, []);

  // Countdown Timer
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);

      return () => clearTimeout(countdown);
    }
  }, [timer]);

  // Handle OTP Input
  const handleChange = (value, index) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);

    setOtp(newOtp);

    // Auto Focus Next Input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle Backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Verify OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    const enteredOTP = otp.join("");

    if (enteredOTP.length !== 6) {
      return alert("Please enter the complete 6-digit OTP");
    }

    const registerData = readRegisterData();

    if (!registerData || !registerData.email) {
      alert("Registration data missing. Please register again.");
      return navigate("/register");
    }

    let isOtpVerified = false;

    try {
      setLoading(true);

      // Verify OTP with Backend
      await API.post("/auth/verify-otp", {
        email: registerData.email.trim().toLowerCase(),
        otp: enteredOTP,
      });

      isOtpVerified = true;

      // Register User
      await API.post("/auth/register", {
        ...registerData,
        email: registerData.email.trim().toLowerCase(),
      });

      alert("Registration Successful ✅");
      localStorage.removeItem("registerData");
      localStorage.removeItem("devOTP");

      navigate("/login");

    } catch (error) {
      if (!isOtpVerified) {
        alert(error.response?.data?.message || "Invalid OTP ❌");
      } else {
        alert(error.response?.data?.message || "Registration failed. Please try again. ❌");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    const registerData = readRegisterData();

    if (!registerData || !registerData.email) {
      alert("Registration data missing. Please register again.");
      return navigate("/register");
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/send-otp", {
        email: registerData.email.trim().toLowerCase(),
      });

      if (res.data.otp) {
        localStorage.setItem("devOTP", res.data.otp);
        setIsDevMode(true);
        setDevOtpCode(res.data.otp);
        setOtp(res.data.otp.split(""));
      } else {
        localStorage.removeItem("devOTP");
        setIsDevMode(false);
        setDevOtpCode("");
        setOtp(["", "", "", "", "", ""]);
      }

      alert(res.data.message || "New OTP Sent ✅");
      setTimer(60);

    } catch (error) {
      alert(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black flex items-center justify-center px-4 overflow-hidden relative">

      {/* Glow Effects */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-72 h-72 bg-cyan-500 rounded-full blur-3xl"
      ></motion.div>

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"
      ></motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 45, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 text-white"
      >

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.6, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 15, delay: 0.1 }}
          className="flex justify-center mb-5"
        >
          <img
            src="/logo.png"
            alt="Logo"
            className="w-24 h-24 rounded-3xl bg-pure-white p-2 shadow-lg"
          />
        </motion.div>

        {/* Heading */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="text-4xl font-extrabold"
          >
            Verify OTP
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.22 }}
            className="text-gray-300 mt-3"
          >
            Enter the 6-digit verification code sent to your email
          </motion.p>
        </div>

        {/* Development Fallback Banner */}
        {isDevMode && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="mt-6 p-4 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-sm flex flex-col gap-1 items-center text-center shadow-lg"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Development Fallback Active
            </div>
            <p className="text-gray-200">
              SMTP service is offline. We've auto-filled the OTP:
            </p>
            <span className="font-mono text-lg font-bold text-white tracking-widest bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-500/30">
              {devOtpCode}
            </span>
            <p className="text-gray-300 text-xs mt-1 text-center">
              You can also use the Master OTP: <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono font-bold">123456</code>
            </p>
          </motion.div>
        )}

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="mt-10">

          {/* OTP Inputs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex justify-center gap-3"
          >
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                variants={itemVariants}
                whileFocus={{ scale: 1.08, borderColor: "#22d3ee" }}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) =>
                  handleChange(e.target.value, index)
                }
                onKeyDown={(e) =>
                  handleKeyDown(e, index)
                }
                className="w-14 h-16 text-center text-2xl font-bold rounded-2xl bg-white/10 border border-white/20 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
              />
            ))}
          </motion.div>

          {/* Verify Button */}
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 350, damping: 20 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-bold py-4 rounded-2xl shadow-xl transition duration-300 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </motion.button>
        </form>

        {/* Timer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center mt-6"
        >
          {timer > 0 ? (
            <p className="text-gray-400">
              Resend OTP in{" "}
              <span className="text-cyan-400 font-bold">
                {timer}s
              </span>
            </p>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resendOTP}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Resend OTP
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default VerifyOTP;