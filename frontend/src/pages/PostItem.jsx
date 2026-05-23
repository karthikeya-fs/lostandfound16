import { useState, useEffect } from "react";
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
  FiTag,
  FiMapPin,
  FiCalendar,
  FiPlusCircle,
  FiList,
  FiCpu,
  FiCreditCard,
  FiEyeOff,
  FiBox,
  FiLock,
} from "react-icons/fi";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
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

function PostItem() {
  const { categories, buildings, buildingNames } = useCampusMetadata();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "found",
    category: "",
    location: "",
    date: "",
    image: null,
    blurImage: false,
  });

  const [securityQuestionsEnabled, setSecurityQuestionsEnabled] = useState(false);
  const [verificationQuestions, setVerificationQuestions] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

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
      toast.error("Please fill in the item title and description first");
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
      setVerificationQuestions([
        { question: generated[0]?.question || generated[0] || "", answer: verificationQuestions[0]?.answer || "" },
        { question: generated[1]?.question || generated[1] || "", answer: verificationQuestions[1]?.answer || "" },
      ]);
    } catch (error) {
      toast.error("Failed to auto-generate questions. Enter them manually.");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      toast.error("Please select a category.");
      return;
    }
    if (!formData.location) {
      toast.error("Please tag a campus location.");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("type", formData.type);
      data.append("category", formData.category);
      data.append("location", formData.location);
      data.append("date", formData.date);
      data.append("blurImage", formData.blurImage);
      if (formData.image instanceof File) {
        data.append("image", formData.image);
      }

      const questionsToSend = securityQuestionsEnabled
        ? verificationQuestions.filter((q) => q.question?.trim() && q.answer?.trim())
        : [];
      data.append("verificationQuestions", JSON.stringify(questionsToSend));

      const res = await API.post("/items/create", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(res.data.message || "Item posted successfully");
      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "found",
        category: "",
        location: "",
        date: "",
        image: null,
        blurImage: false,
      });
      setSecurityQuestionsEnabled(false);
      setVerificationQuestions([
        { question: "", answer: "" },
        { question: "", answer: "" },
      ]);
      setPreview(null);
    } catch (error) {
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
      title="Post Found Item"
      subtitle="Complete the form details and tag the location on the map to help reuniting the item."
      icon={<FiPlusCircle />}
    >
      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="form-stack text-left"
      >
        {/* Upload Section */}
        <motion.div variants={itemVariants} className="form-field">
          <span className="form-label-static" id="post-photo-label">
            Item Photo
          </span>
          <motion.label
            whileHover={{ scale: 1.01, borderColor: "var(--text)" }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="form-upload"
            htmlFor="post-item-photo"
            aria-labelledby="post-photo-label"
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
              id="post-item-photo"
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
              If enabled, this image will remain blurred in public search until someone submits a verified proof of ownership. Highly recommended for ID cards, keys, or wallets.
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
            ></div>
          </button>
        </motion.div>

        {/* Security Questionnaire */}
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
                Add 1-2 hidden questions that a claimant must answer to verify their ownership (e.g. background image on phone, contents inside wallet).
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
              ></div>
            </button>
          </div>

          {securityQuestionsEnabled && (
            <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-gray-300">Set Hidden Questions</label>
                <button
                 
  type="button"
  onClick={handleGenerateQuestions}

                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-lg hover:bg-cyan-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5"
                >
                  {generatingQuestions ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
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

              {!formData.title || !formData.description ? (
                <p className="text-[11px] text-amber-400/80 italic">
                  * Fill out the item title and description to enable AI question generation.
                </p>
              ) : null}

              <div className="flex flex-col gap-4">
                {[0, 1].map((idx) => (
                  <div key={idx} className="space-y-2 p-3 rounded-xl bg-black/20 border border-white/5">
                    <input
                      type="text"
                      placeholder={`Question ${idx + 1} (hidden from public)`}
                      value={verificationQuestions[idx]?.question || ""}
                      onChange={(e) => {
                        const updated = [...verificationQuestions];
                        updated[idx] = { ...updated[idx], question: e.target.value };
                        setVerificationQuestions(updated);
                      }}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Expected answer (only you see this)"
                      value={verificationQuestions[idx]?.answer || ""}
                      onChange={(e) => {
                        const updated = [...verificationQuestions];
                        updated[idx] = { ...updated[idx], answer: e.target.value };
                        setVerificationQuestions(updated);
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
              placeholder="Describe the item's condition, characteristics, distinct marks (please do not write passwords or card pins)..."
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
              className="form-input"
            />
          </div>
        </motion.div>

        {/* Category Choice Grid */}
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

        {/* Location Dropdown Selection & Interactive Map */}
        <motion.div variants={itemVariants} className="form-field">
          <label htmlFor="location">Where was it found?</label>
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

        {/* Precision Date & Time Picker */}
        <motion.div variants={itemVariants} className="form-field">
          <label htmlFor="date">Date & Time Found</label>
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

        {/* Submit */}
        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          className="form-btn-primary mt-4"
        >
          {loading ? "Posting..." : "Post Found Item"}
          <motion.span
            animate={loading ? { rotate: 360 } : {}}
            transition={loading ? { repeat: Infinity, duration: 1.2, ease: "linear" } : {}}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <FiPlusCircle aria-hidden />
          </motion.span>
        </motion.button>
      </motion.form>
    </FormLayout>
  );
}

export default PostItem;
