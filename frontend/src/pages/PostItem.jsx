import { useState, useEffect } from "react";
import API from "../services/api";
import FormLayout from "../components/FormLayout";
import {
  FiImage,
  FiType,
  FiAlignLeft,
  FiTag,
  FiMapPin,
  FiCalendar,
  FiPlusCircle,
  FiList,
} from "react-icons/fi";

function PostItem() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "found",
    category: "",
    location: "",
    date: "",
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
      data.append("type", formData.type);
      data.append("category", formData.category);
      data.append("location", formData.location);
      data.append("date", formData.date);
      if (formData.image instanceof File) {
        data.append("image", formData.image);
      }

      const res = await API.post("/items/create", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(res.data.message || "Item Posted Successfully ✅");
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      maxWidth="md"
      backTo="/home"
      backLabel="Back to home"
      title="Post item"
      subtitle="Found is selected by default. Change the type if you are posting something else."
      icon={<FiPlusCircle />}
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <div className="form-field">
          <span className="form-label-static" id="post-photo-label">
            Item photo
          </span>
          <label className="form-upload" htmlFor="post-item-photo" aria-labelledby="post-photo-label">
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
              placeholder="e.g. Black leather wallet"
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
              placeholder="Describe the item in detail..."
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
            <label htmlFor="type">Item type</label>
            <div className="form-input-wrap form-input-wrap--select">
              <FiList className="form-input-icon" aria-hidden />
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-input"
              >
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="category">Category</label>
            <div className="form-input-wrap">
              <FiTag className="form-input-icon" aria-hidden />
              <input
                id="category"
                type="text"
                name="category"
                placeholder="Electronics, ID card..."
                value={formData.category}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="location">Location</label>
          <div className="form-input-wrap">
            <FiMapPin className="form-input-icon" aria-hidden />
            <input
              id="location"
              type="text"
              name="location"
              placeholder="Library, cafeteria..."
              value={formData.location}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="date">Date</label>
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

        <button type="submit" disabled={loading} className="form-btn-primary">
          {loading ? "Posting..." : "Post item"}
          <FiPlusCircle aria-hidden />
        </button>
      </form>
    </FormLayout>
  );
}

export default PostItem;
