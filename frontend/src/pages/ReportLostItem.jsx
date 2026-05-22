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
  FiAlertTriangle,
  FiEyeOff,
  FiCpu,
} from "react-icons/fi";

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

    securityQuestions: [
      { question: "", answer: "" },
      { question: "", answer: "" },
    ],
  });

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

      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...formData.securityQuestions];

    updated[index][field] = value;

    setFormData((prev) => ({
      ...prev,
      securityQuestions: updated,
    }));
  };

  const handleGenerateQuestions = async () => {
    try {
      if (!formData.title || !formData.description) {
        toast.error("Please enter title and description first");
        return;
      }

      setGeneratingQuestions(true);

      const res = await API.post("/items/generate-questions", {
        title: formData.title,
        description: formData.description,
        category: formData.category,
      });

      const aiQuestions = res.data.questions || [];

      setFormData((prev) => ({
        ...prev,
        securityQuestions: aiQuestions.map((q) => ({
          question: q.question,
          answer: "",
        })),
      }));

      toast.success("AI questions generated");
    } catch (error) {
      console.log(error);
      toast.error("Failed to generate AI questions");
    } finally {
      setGeneratingQuestions(false);
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
    setFormData((prev) => ({
      ...prev,
      location: locId,
    }));
  };

  const handleToggleBlur = () => {
    setFormData((prev) => ({
      ...prev,
      blurImage: !prev.blurImage,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      data.append(
        "securityQuestions",
        JSON.stringify(formData.securityQuestions)
      );

      if (formData.image) {
        data.append("image", formData.image);
      }

      const res = await API.post("/items/report-lost", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(res.data.message || "Lost item reported");

      navigate("/lost-reports");
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout title="Report Lost Item">
      <form onSubmit={handleSubmit} className="space-y-6">

        <input
          type="text"
          name="title"
          placeholder="Item Title"
          value={formData.title}
          onChange={handleChange}
          className="form-input"
        />

        <textarea
          name="description"
          placeholder="Detailed Description"
          value={formData.description}
          onChange={handleChange}
          className="form-input"
        />

        <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5">

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-lg">
                Security Verification Questions
              </h3>

              <p className="text-gray-400 text-sm">
                Add hidden questions to verify ownership.
              </p>
            </div>

            <button
  type="button"
  onClick={handleGenerateQuestions}
  className="px-3 py-2 bg-cyan-500 text-black rounded-xl text-sm font-bold flex items-center gap-2"
>
  {generatingQuestions ? (
    "Generating..."
  ) : (
    <>
      <FiCpu />
      ✨ Generate with AI
    </>
  )}
</button>
          </div>

          <div className="space-y-5">

            {formData.securityQuestions.map((q, index) => (
              <div
                key={index}
                className="bg-black/20 border border-white/10 rounded-xl p-4"
              >
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) =>
                    handleQuestionChange(
                      index,
                      "question",
                      e.target.value
                    )
                  }
                  placeholder={`Question ${index + 1}`}
                  className="form-input mb-3"
                />

                <input
                  type="text"
                  value={q.answer}
                  onChange={(e) =>
                    handleQuestionChange(
                      index,
                      "answer",
                      e.target.value
                    )
                  }
                  placeholder="Expected answer"
                  className="form-input"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500 text-black py-3 rounded-xl font-bold"
        >
          {loading ? "Submitting..." : "Submit Lost Report"}
        </button>
      </form>
    </FormLayout>
  );
}

export default ReportLostItem;