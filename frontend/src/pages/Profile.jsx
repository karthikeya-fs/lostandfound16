import { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiBell,
  FiCamera,
  FiEdit2,
  FiSave,
  FiX,
  FiCheckCircle,
  FiArrowLeft,
  FiGithub,
  FiLinkedin,
  FiShield,
  FiActivity,
  FiAward,
} from "react-icons/fi";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import API from "../services/api";

function Profile() {
  const [profileImage, setProfileImage] = useState(null);

  const [user, setUser] = useState({
    name: "",
    rollNumber: "",
    email: "",
    department: "",
    phone: "",
    github: "",
    linkedin: "",
    postCount: 0,
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: false,
    weeklySummary: true,
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    rollNumber: "",
    department: "",
    phone: "",
    github: "",
    linkedin: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedNotifications = localStorage.getItem("notifications");

    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "notifications",
      JSON.stringify(notifications)
    );
  }, [notifications]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        const res = await API.get("/auth/profile");

        setUser({
          name: res.data.name || "Not specified",
          rollNumber: res.data.rollNumber || "Not specified",
          email: res.data.email || email,
          department: res.data.department || "Not specified",
          phone: res.data.phone || "Not specified",
          github: res.data.github || "",
          linkedin: res.data.linkedin || "",
          postCount: res.data.postCount || 0,
        });

        setEditData({
          name: res.data.name || "",
          rollNumber: res.data.rollNumber || "",
          department: res.data.department || "",
          phone: res.data.phone || "",
          github: res.data.github || "",
          linkedin: res.data.linkedin || "",
        });
      } catch (error) {
        console.error(error);

        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await API.put("/auth/profile", editData);

      setUser((prev) => ({
        ...prev,
        ...editData,
      }));

      toast.success("Profile updated successfully");

      setEditing(false);
    } catch (error) {
      console.error(error);

      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    setEditData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const calculateProfileCompletion = () => {
    let completed = 0;

    const fields = [
      user.name,
      user.rollNumber,
      user.department,
      user.phone,
      user.github,
      user.linkedin,
    ];

    fields.forEach((field) => {
      if (field && field !== "Not specified") {
        completed += 16;
      }
    });

    return completed;
  };

  const profileCompletion = calculateProfileCompletion();

  const greeting =
    new Date().getHours() < 12
      ? "Good Morning"
      : new Date().getHours() < 18
      ? "Good Afternoon"
      : "Good Evening";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-950 text-white overflow-x-hidden pb-12"
    >
      {/* Background */}
      <div className="relative h-72 bg-gradient-to-r from-blue-900 via-cyan-900 to-slate-900 overflow-hidden">
        <div className="absolute top-[-30%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full"></div>

        <div className="absolute bottom-[-30%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full"></div>

        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
          <Link
            to="/home"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-lg border border-white/10 hover:bg-black/50 transition"
          >
            <FiArrowLeft />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT SIDE */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Avatar */}
            <div className="flex justify-center -mt-24 mb-6">
              <div className="relative group">
                <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-r from-cyan-400 to-blue-600">
                  <div className="w-full h-full rounded-full bg-slate-950 overflow-hidden relative">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiUser className="text-7xl text-gray-500" />
                      </div>
                    )}

                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition">
                      <FiCamera className="text-3xl" />

                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
             <p className="text-cyan-400 text-sm mb-2">
             {greeting}, {user.name || "User"} 👋
             </p>

              <h1 className="text-3xl font-bold">
                {user.name}
              </h1>

              <p className="text-gray-400 mt-2">
                {user.department}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-1 rounded-full text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Active User
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                <h2 className="text-3xl font-bold">
                  {user.postCount}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Posts
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                <h2 className="text-3xl font-bold">
                  12
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Resolved
                </p>
              </div>
            </div>

            {/* Completion */}
            <div className="mt-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">
                  Profile Completion
                </span>

                <span className="text-cyan-400 font-bold">
                  {profileCompletion}%
                </span>
              </div>

              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                  style={{
                    width: `${profileCompletion}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Achievements */}
            <div className="mt-8">
              <h3 className="text-sm text-gray-400 uppercase mb-4">
                Achievements
              </h3>

              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm flex items-center gap-2">
                  <FiAward />
                  Trusted Finder
                </div>

                <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm flex items-center gap-2">
                  <FiShield />
                  Verified User
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Details */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold">
                    Profile Details
                  </h2>

                  <p className="text-gray-400 text-sm mt-1">
                    Manage your account information
                  </p>
                </div>

                {editing ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                    >
                      <FiX />
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 font-semibold flex items-center gap-2"
                    >
                      <FiSave />
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 flex items-center gap-2"
                  >
                    <FiEdit2 />
                    Edit
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    label: "Full Name",
                    name: "name",
                    value: editData.name,
                    icon: <FiUser />,
                  },
                  {
                    label: "Phone",
                    name: "phone",
                    value: editData.phone,
                    icon: <FiPhone />,
                  },
                  {
                    label: "Department",
                    name: "department",
                    value: editData.department,
                    icon: <FiBookOpen />,
                  },
                  {
                    label: "Roll Number",
                    name: "rollNumber",
                    value: editData.rollNumber,
                    icon: <FiCheckCircle />,
                  },
                ].map((field, index) => (
                  <div key={index}>
                    <label className="text-sm text-gray-400 mb-2 block">
                      {field.label}
                    </label>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      {field.icon}

                      {editing ? (
                        <input
                          type="text"
                          name={field.name}
                          value={field.value}
                          onChange={handleInputChange}
                          className="bg-transparent outline-none w-full"
                        />
                      ) : (
                        <span>{user[field.name]}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Email */}
              <div className="mt-6">
                <label className="text-sm text-gray-400 mb-2 block">
                  Email Address
                </label>

                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <FiMail />

                  <span>{user.email}</span>

                  <FiCheckCircle className="ml-auto text-green-400" />
                </div>
              </div>

              {/* Social Links */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    GitHub
                  </label>

                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <FiGithub />

                    {editing ? (
                      <input
                        type="text"
                        name="github"
                        value={editData.github}
                        onChange={handleInputChange}
                        className="bg-transparent outline-none w-full"
                      />
                    ) : (
                      <span>{user.github || "Not Added"}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    LinkedIn
                  </label>

                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <FiLinkedin />

                    {editing ? (
                      <input
                        type="text"
                        name="linkedin"
                        value={editData.linkedin}
                        onChange={handleInputChange}
                        className="bg-transparent outline-none w-full"
                      />
                    ) : (
                      <span>{user.linkedin || "Not Added"}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <FiBell className="text-cyan-400" />
                Notifications
              </h2>

              <div className="space-y-4">
                {[
                  {
                    title: "Email Alerts",
                    key: "emailAlerts",
                  },
                  {
                    title: "Push Notifications",
                    key: "pushNotifications",
                  },
                  {
                    title: "Weekly Summary",
                    key: "weeklySummary",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <span>{item.title}</span>

                    <button
                      onClick={() =>
                        toggleNotification(item.key)
                      }
                      className={`w-14 h-7 rounded-full p-1 transition ${
                        notifications[item.key]
                          ? "bg-cyan-500"
                          : "bg-gray-600"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition ${
                          notifications[item.key]
                            ? "translate-x-7"
                            : ""
                        }`}
                      ></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <FiActivity className="text-cyan-400" />
                Recent Activity
              </h2>

              <div className="space-y-6">
                <div className="border-l-2 border-cyan-500 pl-4">
                  <p>Reported a lost wallet</p>
                  <span className="text-sm text-gray-400">
                    2 hours ago
                  </span>
                </div>

                <div className="border-l-2 border-blue-500 pl-4">
                  <p>Updated profile details</p>
                  <span className="text-sm text-gray-400">
                    Yesterday
                  </span>
                </div>

                <div className="border-l-2 border-purple-500 pl-4">
                  <p>Resolved a found item case</p>
                  <span className="text-sm text-gray-400">
                    3 days ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Profile;