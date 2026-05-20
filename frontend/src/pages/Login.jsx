import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import FormLayout from "../components/FormLayout";
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiUserPlus } from "react-icons/fi";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
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
      const res = await API.post("/auth/login", formData);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userEmail", res.data.user.email);

      alert("Login Successful ✅ ");
      navigate("/home");
    } catch (error) {
      alert(error.response?.data?.message || "Login Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout
      title="Welcome back"
      subtitle="Sign in with your university email"
      icon={<FiLogIn />}
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <div className="form-field">
          <label htmlFor="email">University email</label>
          <div className="form-input-wrap">
            <FiMail className="form-input-icon" aria-hidden />
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@college.edu"
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="form-input-wrap">
            <FiLock className="form-input-icon" aria-hidden />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
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
        </div>

        <div className="form-actions-end">
          <Link to="/forgot-password" className="form-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading} className="form-btn-primary">
          {loading ? "Signing in..." : "Sign in"}
          <FiLogIn aria-hidden />
        </button>
      </form>

      <Link to="/register" className="form-btn-secondary form-external-actions">
        <FiUserPlus aria-hidden />
        Create account
      </Link>
    </FormLayout>
  );
}

export default Login;
