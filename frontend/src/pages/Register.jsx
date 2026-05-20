import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import FormLayout from "../components/FormLayout";
import { FiUser, FiMail, FiLock, FiBook, FiUserPlus } from "react-icons/fi";

const DEPARTMENTS = [
  { value: "CSE", label: "Computer Science & Engineering (CSE)" },
  { value: "IT", label: "Information Technology (IT)" },
  { value: "ECE", label: "Electronics & Communication (ECE)" },
  { value: "EEE", label: "Electrical & Electronics (EEE)" },
  { value: "MECH", label: "Mechanical Engineering" },
  { value: "CIVIL", label: "Civil Engineering" },
  { value: "CHEM", label: "Chemical Engineering" },
  { value: "AERO", label: "Aerospace / Aeronautical Engineering" },
  { value: "BIOTECH", label: "Biotechnology" },
  { value: "AIML", label: "AI & Machine Learning / Data Science" },
  { value: "ARCH", label: "Architecture" },
  { value: "MBA", label: "MBA / Management" },
  { value: "MCA", label: "MCA (Computer Applications)" },
  { value: "PHARM", label: "Pharmacy" },
  { value: "LAW", label: "Law" },
  { value: "SCIENCE", label: "Science (Physics / Chemistry / Maths)" },
  { value: "HUMANITIES", label: "Arts & Humanities" },
  { value: "OTHER", label: "Other" },
];

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await API.post("/auth/send-otp", {
        email: formData.email,
      });

      alert(res.data.message);

      localStorage.setItem("registerData", JSON.stringify(formData));
      navigate("/verify-otp");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to Send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      title="Create account"
      subtitle="Join the campus lost & found network"
      icon={<FiUserPlus />}
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <div className="form-field">
          <label htmlFor="name">Full name</label>
          <div className="form-input-wrap">
            <FiUser className="form-input-icon" />
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Your name"
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="email">University email</label>
          <div className="form-input-wrap">
            <FiMail className="form-input-icon" />
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@university.edu"
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="form-input-wrap">
            <FiLock className="form-input-icon" />
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Create a strong password"
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="department">Department</label>
          <div className="form-input-wrap form-input-wrap--select">
            <FiBook className="form-input-icon" aria-hidden />
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="form-input"
            >
              <option value="" disabled>
                Select your department
              </option>
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="form-btn-primary">
          {loading ? "Sending OTP..." : "Continue"}
          <FiUserPlus aria-hidden />
        </button>
      </form>

      <p className="form-footer">
        Already have an account?{" "}
        <Link to="/login" className="form-link">
          Sign in
        </Link>
      </p>
    </FormLayout>
  );
}

export default Register;
