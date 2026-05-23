import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import API from "../services/api";
import FormLayout from "../components/FormLayout";
import CampusMap from "../components/CampusMap";
import { useCampusMetadata } from "../hooks/useCampusMetadata";

import {
  FiImage,
  FiType,
  FiAlignLeft,
  FiMapPin,
  FiCalendar,
  FiPhone,
  FiDollarSign,
  FiEyeOff,
  FiCpu,
  FiLock,
  FiAlertTriangle,
} from "react-icons/fi";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
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

function ReportLostItem() {
  const navigate = useNavigate();
  const { categories, buildings, buildingNames } = useCampusMetadata();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    date: "",
    reward: "",
    contact: "",
    image: null,
    blurImage: false,
  });

  const [securityQuestionsEnabled, setSecurityQuestionsEnabled] = useState(false);
  const [securityQuestions, setSecurityQuestions] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e) => {
    if (e.target.name === "image") {
      const file = e.target.files?.[0];
      if (!file) return;
      setFormData((prev) => ({ ...prev, image: file }));
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    } else {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const handleCategorySelect = (cat) => {
    setFormData((prev) => ({
      ...prev,
      category: cat.id,
      blurImage: cat.blurByDefault ? true : prev.blurImage,
    }));
  };

  const handleLocationSelect = (locId) => {
    setFormData((prev) => ({ ...prev, location: locId }));
  };

  const handleToggleBlur = () => {
    setFormData((prev) => ({ ...prev, blurImage: !prev.blurImage }));
  };

  const handleGenerateQuestions = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please enter title and description first");
      return;
    }
    try {
      setGeneratingQuestions(true);
      const res = await API.post("/items/generate-questions", {
        title: formData.title,
        description: formData.description,
        category: formData.category,
      });
      const generated = res.data.questions || [];
      setSecurityQuestions([
        { question: generated[0]?.question || generated[0] || "", answer: securityQuestions[0]?.answer || "" },
        { question: generated[1]?.question || generated[1] || "", answer: securityQuestions[1]?.answer || "" },
      ]);
      toast.success("AI questions generated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI questions");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!formData.location) {
      toast.error("Please tag a campus location");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("type", "lost");
      data.append("category", formData.category);
      data.append("location", formData.location);
      data.append("date", formData.date);
      data.append("reward", formData.reward || "");
      data.append("contact", formData.contact || "");
      data.append("blurImage", formData.blurImage);

      const questionsToSend = securityQuestionsEnabled
        ? securityQuestions.filter((q) => q.question?.trim() && q.answer?.trim())
        : [];
      data.append("verificationQuestions", JSON.stringify(questionsToSend));

      if (formData.image instanceof File) {
        data.append("image", formData.image);
      }

      const res = await API.post("/items/report-lost", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(res.data.message || "Lost item reported successfully");
      navigate("/lost-reports");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      maxWidth="md"
      backTo="/home"
      backLabel="Back to home"
      title="Report Lost Item"
      subtitle="Fill in the details to help others identify and return your lost item."
      icon={<FiAlertTriangle />}
    >
      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="form-stack text-left"
      >
        {/* Photo Upload */}
        <motion.div variants={itemVariants} className="form-field">
          <span className="form-label-static" id="lost-photo-label">
            Item Photo (optional)
          </span>
          <motion.label
            whileHover={{ scale: 1.01, borderColor: "var(--text)" }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="form-upload"
            htmlFor="lost-item-photo"
            aria-labelledby="lost-photo-label"
          >
            {preview ? (
              <>
                <img src={preview} alt="" className="form-upload-preview" />
                <span className="form-upload-overlay">
                  <FiImage aria-hidden /> Change photo
                </span>
              </>
            ) : (
              <span className="form-upload-placeholder">
                <FiImage aria-hidden />
                <p>Choose or drop an image</p>
                <p className="form-upload-hint">PNG, JPG up to 5MB</p>
              </span>
            )}
            <input
              id="lost-item-photo"
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="form-upload-input"
            />
          </motion.label>
        </motion.div>

        {/* Privacy Blur Toggle */}
        <motion.div
          variants={itemVariants}
          className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4"
        >
          <div className="flex-1">
            <h4 className="text-white font-bold text-sm flex items-center gap-2 mb-1">
              <FiEyeOff className="text-cyan-400" />
              Privacy Image Blurring
            </h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              If enabled, the image stays blurred in public search until ownership is verified. Recommended for ID cards, keys, or wallets.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleBlur}
            className={`w-14 h-7 rounded-full p-1 transition-all duration-300 relative shrink-0 ${
              formData.blurImage ? "bg-cyan-500" : "bg-gray-600"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${
                formData.blurImage ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
        </motion.div>

        {/* Security Questions */}
        <motion.div
          variants={itemVariants}
          className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-white font-bold text-sm flex items-center gap-2 mb-1">
                <FiLock className="text-cyan-400" />
                Security Verification Questions
              </h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                Add 1-2 hidden questions a finder must answer to verify they have your item.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSecurityQuestionsEnabled(!securityQuestionsEnabled)}
              className={`w-14 h-7 rounded-full p-1 transition-all duration-300 relative shrink-0 ${
                securityQuestionsEnabled ? "bg-cyan-500" : "bg-gray-600"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${
                  securityQuestionsEnabled ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {securityQuestionsEnabled && (
            <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-gray-300">Set Hidden Questions</label>
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-lg hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
                >
                  {generatingQuestions ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiCpu className="text-cyan-400" />
                      ✨ Generate with AI
                    </>
                  )}
                </button>
              </div>

              {(!formData.title || !formData.description) && (
                <p className="text-[11px] text-amber-400/80 italic">
                  * Fill out the item title and description to enable AI question generation.
                </p>
              )}

              <div className="flex flex-col gap-4">
                {[0, 1].map((idx) => (
                  <div key={idx} className="space-y-2 p-3 rounded-xl bg-black/20 border border-white/5">
                    <input
                      type="text"
                      placeholder={`Question ${idx + 1} (hidden from public)`}
                      value={securityQuestions[idx]?.question || ""}
                      onChange={(e) => {
                        const updated = [...securityQuestions];
                        updated[idx] = { ...updated[idx], question: e.target.value };
                        setSecurityQuestions(updated);
                      }}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Expected answer (only you see this)"
                      value={securityQuestions[idx]?.answer || ""}
                      onChange={(e) => {
                        const updated = [...securityQuestions];
                        updated[idx] = { ...updated[idx], answer: e.target.value };
                        setSecurityQuestions(updated);
                      }}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants} className="form-field">
          <label htmlFor="title">Item Title</label>
          <div className="form-input-wrap">
            <FiType className="form-input-icon" aria-hidden />
            <input
              id="title"
              type="text"
              name="title"
              placeholder="e.g. Black leather wallet, iPhone 13"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </motion.div>

        {/* Description */}
        <motion.div variants={itemVariants} className="form-field">
          <label htmlFor="description">Detailed Description</label>
          <div className="form-input-wrap">
            <FiAlignLeft className="form-input-icon form-textarea-icon" aria-hidden />
            <textarea
              id="description"
              name="description"
              placeholder="Describe the item's condition, characteristics, distinct marks..."
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
              className="form-input"
            />
          </div>
        </motion.div>

        {/* Category */}
        <motion.div variants={itemVariants} className="form-field">
          <label>Select Category</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1.5">
            {categories.map((cat) => {
              const isSelected = formData.category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 gap-2 ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "bg-slate-900/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span className="text-xl">
                    <cat.Icon />
                  </span>
                  <span className="text-xs font-bold">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Location */}
        <motion.div variants={itemVariants} className="form-field">
          <label htmlFor="location">Where did you lose it?</label>
          <div className="form-input-wrap mb-4">
            <FiMapPin className="form-input-icon" aria-hidden />
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="" disabled>Select campus building or grounds...</option>
              {buildingNames.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <CampusMap
            selectedLocation={formData.location}
            onSelectLocation={handleLocationSelect}
            buildings={buildings}
          />
        </motion.div>

        {/* Date */}
        <motion.div variants={itemVariants} className="form-field">
          <label htmlFor="date">Date & Time Lost</label>
          <div className="form-input-wrap">
            <FiCalendar className="form-input-icon" aria-hidden />
            <input
              id="date"
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </motion.div>

        {/* Reward */}
        <motion.div variants={itemVariants} className="form-field">
          <label htmlFor="reward">Reward (optional)</label>
          <div className="form-input-wrap">
            <FiDollarSign className="form-input-icon" aria-hidden />
            <input
              id="reward"
              type="text"
              name="reward"
              placeholder="e.g. ₹500 reward"
              value={formData.reward}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div variants={itemVariants} className="form-field">
          <label htmlFor="contact">Contact Info (optional)</label>
          <div className="form-input-wrap">
            <FiPhone className="form-input-icon" aria-hidden />
            <input
              id="contact"
              type="text"
              name="contact"
              placeholder="e.g. Room 204, Block B"
              value={formData.contact}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </motion.div>

        {/* Submit */}
        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          className="form-btn-primary mt-4"
        >
          {loading ? "Submitting..." : "Submit Lost Report"}
          <motion.span
            animate={loading ? { rotate: 360 } : {}}
            transition={loading ? { repeat: Infinity, duration: 1.2, ease: "linear" } : {}}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <FiAlertTriangle aria-hidden />
          </motion.span>
        </motion.button>
      </motion.form>
    </FormLayout>
  );
}

export default ReportLostItem;
