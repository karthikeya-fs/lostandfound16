import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function VerifyOTP() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);

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
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Handle Backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  // Verify OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    const enteredOTP = otp.join("");

    if (enteredOTP.length !== 6) {
      return alert("Please enter the complete 6-digit OTP");
    }

    const registerData = JSON.parse(localStorage.getItem("registerData"));

    if (!registerData || !registerData.email) {
      alert("Registration data missing. Please register again.");
      return navigate("/register");
    }

    try {
      setLoading(true);

      // Verify OTP with Backend
      await API.post("/auth/verify-otp", {
        email: registerData.email,
        otp: enteredOTP,
      });

      // Register User
      await API.post("/auth/register", registerData);

      alert("Registration Successful ✅");
      localStorage.removeItem("registerData");

      navigate("/login");

    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP ❌");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    const registerData = JSON.parse(localStorage.getItem("registerData"));

    if (!registerData || !registerData.email) {
      alert("Registration data missing. Please register again.");
      return navigate("/register");
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/send-otp", {
        email: registerData.email,
      });

      alert(res.data.message || "New OTP Sent ✅");
      setTimer(60);

    } catch (error) {
      alert(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black flex items-center justify-center px-4">

      {/* Glow Effects */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500 rounded-full blur-3xl opacity-20"></div>

      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20"></div>

      {/* Card */}
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 text-white">

        {/* Logo */}
        <div className="flex justify-center mb-5">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-24 h-24 rounded-3xl bg-pure-white p-2 shadow-lg"
            />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold">
            Verify OTP
          </h1>

          <p className="text-gray-300 mt-3">
            Enter the 6-digit verification code sent to your email
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="mt-10">

          {/* OTP Inputs */}
          <div className="flex justify-center gap-3">

            {otp.map((digit, index) => (
              <input
                key={index}
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
                className="w-14 h-16 text-center text-2xl font-bold rounded-2xl bg-white/10 border border-white/20 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-bold py-4 rounded-2xl shadow-xl hover:scale-105 transition duration-300 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {/* Timer */}
        <div className="text-center mt-6">

          {timer > 0 ? (
            <p className="text-gray-400">
              Resend OTP in{" "}
              <span className="text-cyan-400 font-bold">
                {timer}s
              </span>
            </p>
          ) : (
            <button
              onClick={resendOTP}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;