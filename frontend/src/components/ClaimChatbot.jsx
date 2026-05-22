import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiMessageSquare, FiSend, FiX, FiLock } from "react-icons/fi";
import API from "../services/api";

function ClaimChatbot({ itemId, itemTitle, open, onClose, onClaimSubmitted }) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [phase, setPhase] = useState("questions");
  const [claimId, setClaimId] = useState(null);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (!open || !itemId) return;

    const load = async () => {
      try {
        setLoading(true);
        setPhase("questions");
        setStep(0);
        setAnswers([]);
        setCurrentAnswer("");
        setClaimId(null);
        setOtp("");

        const res = await API.post("/ai-claim/questions", { itemId });
        const qs = res.data.questions || [];

        if (!qs.length) {
          toast.error("Could not generate verification questions.");
          onClose();
          return;
        }

        setQuestions(qs);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load questions");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, itemId]);

  const handleNext = () => {
    if (!currentAnswer.trim()) {
      toast.error("Please enter your answer");
      return;
    }

    const nextAnswers = [
      ...answers,
      {
        question: questions[step],
        answer: currentAnswer.trim(),
      },
    ];

    setAnswers(nextAnswers);
    setCurrentAnswer("");

    if (step + 1 < questions.length) {
      setStep((prev) => prev + 1);
      return;
    }

    submitClaim(nextAnswers);
  };

  const submitClaim = async (finalAnswers) => {
    try {
      setLoading(true);

      const res = await API.post("/claims/initiate", {
        itemId,
        answers: finalAnswers,
      });

      const generatedClaimId = res.data.claimId || res.data.claim?._id;

      setClaimId(generatedClaimId);
      setPhase("otp");

      toast.success(res.data.message || "OTP sent to your email");

      if (res.data.otp) {
        toast(`Dev OTP: ${res.data.otp}`, { icon: "🔑" });
      }

      if (typeof onClaimSubmitted === "function") {
        onClaimSubmitted(generatedClaimId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit claim");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("Enter the OTP from your email");
      return;
    }

    try {
      setLoading(true);

      await API.post("/claims/verify-otp", {
        claimId,
        otp: otp.trim(),
      });

      toast.success("OTP verified. Waiting for finder approval.");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const progress =
    phase === "questions" && questions.length
      ? Math.round(((step + 1) / questions.length) * 100)
      : 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <FiMessageSquare className="text-cyan-400" />
            </div>

            <div>
              <h3 className="font-bold text-white">Ownership verification</h3>
              <p className="text-xs text-gray-400 line-clamp-1">{itemTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <FiX />
          </button>
        </div>

        <div className="px-6 py-5">
          {phase === "questions" && (
            <>
              <div className="h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {loading && !questions.length ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                  >
                    <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2">
                      Question {step + 1} of {questions.length}
                    </p>

                    <p className="text-white font-medium mb-4 leading-relaxed">
                      {questions[step]}
                    </p>

                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      rows={3}
                      placeholder="Type your answer..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                    />
                  </motion.div>
                </AnimatePresence>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={handleNext}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition"
              >
                <FiSend />
                {step + 1 < questions.length ? "Next question" : "Submit claim"}
              </button>
            </>
          )}

          {phase === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400/90 text-sm mb-2">
                <FiLock />
                <span>Enter the 6-digit code sent to your email</span>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-[0.5em] px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 text-black font-bold py-3 rounded-xl disabled:opacity-50"
              >
                Verify OTP
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ClaimChatbot;