import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import FormLayout from "../components/FormLayout";
import {
  FiImage,
  FiType,
  FiAlignLeft,
  FiTag,
  FiMapPin,
  FiCalendar,
  FiPhone,
  FiDollarSign,
  FiAlertTriangle,
} from "react-icons/fi";

function ReportLostItem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    date: "",
    reward: "",
    contact: "",
    image: null,
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("location", formData.location);
      data.append("date", formData.date);
      data.append("reward", formData.reward);
      data.append("contact", formData.contact);
      if (formData.image instanceof File) {
        data.append("image", formData.image);
      }

      const res = await API.post("/items/report-lost", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(res.data.message || "Lost Item Reported Successfully ✅");
      navigate("/lost-reports");
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      maxWidth="lg"
      backTo="/home"
      backLabel="Back to home"
      title="Report lost item"
      subtitle="Submit details so others can help return your item"
      icon={<FiAlertTriangle />}
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <div className="form-field">
          <span className="form-label-static" id="report-photo-label">
            Item photo (optional)
          </span>
          <label className="form-upload" htmlFor="report-lost-photo" aria-labelledby="report-photo-label">
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
                <p>Choose or drop a photo</p>
                <p className="form-upload-hint">PNG, JPG up to 5MB</p>
              </span>
            )}
            <input
              id="report-lost-photo"
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="form-upload-input"
            />
          </label>
        </div>

        <div className="form-field">
          <label htmlFor="title">Item title</label>
          <div className="form-input-wrap">
            <FiType className="form-input-icon" aria-hidden />
            <input
              id="title"
              type="text"
              name="title"
              placeholder="e.g. AirPods Pro, house keys"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="description">Description</label>
          <div className="form-input-wrap">
            <FiAlignLeft className="form-input-icon form-textarea-icon" aria-hidden />
            <textarea
              id="description"
              name="description"
              placeholder="Color, brand, distinct marks..."
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="category">Category</label>
            <div className="form-input-wrap">
              <FiTag className="form-input-icon" aria-hidden />
              <input
                id="category"
                type="text"
                name="category"
                placeholder="Electronics, wallet, keys..."
                value={formData.category}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="reward">Reward (optional)</label>
            <div className="form-input-wrap">
              <FiDollarSign className="form-input-icon" aria-hidden />
              <input
                id="reward"
                type="text"
                name="reward"
                placeholder="e.g. ₹500 or coffee"
                value={formData.reward}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="location">Last seen location</label>
          <div className="form-input-wrap">
            <FiMapPin className="form-input-icon" aria-hidden />
            <input
              id="location"
              type="text"
              name="location"
              placeholder="Library 2nd floor, cafe..."
              value={formData.location}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="date">Date lost</label>
            <div className="form-input-wrap">
              <FiCalendar className="form-input-icon" aria-hidden />
              <input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="contact">Contact</label>
            <div className="form-input-wrap">
              <FiPhone className="form-input-icon" aria-hidden />
              <input
                id="contact"
                type="text"
                name="contact"
                placeholder="Phone or email"
                value={formData.contact}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="form-btn-primary">
          {loading ? "Submitting..." : "Submit report"}
          <FiAlertTriangle aria-hidden />
        </button>
      </form>
    </FormLayout>
  );
}

export default ReportLostItem;
