import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiLogIn,
  FiLogOut,
  FiUserPlus,
  FiPlusCircle,
  FiMenu,
  FiChevronDown,
  FiList,
  FiAlertTriangle,
  FiUser,
  FiMoon,
  FiSun,
  FiFlag,
  FiMessageCircle,
  FiShield,
} from "react-icons/fi";
import {
  isAdmin,
  isAuthenticated,
  clearAuthSession,
} from "../utils/authStorage";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initialDark = savedTheme ? savedTheme === "dark" : prefersDark;
    setIsDarkMode(initialDark);
    document.documentElement.classList.toggle("theme-dark", initialDark);
    document.documentElement.classList.toggle("theme-light", !initialDark);
  }, []);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, [location.pathname]);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    document.documentElement.classList.toggle("theme-dark", nextDark);
    document.documentElement.classList.toggle("theme-light", !nextDark);
  };

  const handleLogout = () => {
    clearAuthSession();
    setLoggedIn(false);
    navigate("/login", { replace: true });
  };

  const isActive = (path) => location.pathname === path;
  const showAdmin = loggedIn && isAdmin();

  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
      style={{ backgroundColor: "var(--navbar)" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-300" />
            <img
              src="/logo.png"
              alt="Logo"
              className="relative w-14 h-14 rounded-2xl shadow-lg object-cover bg-pure-white p-1 transform group-hover:scale-105 transition duration-300"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Lost<span className="text-cyan-400"> & </span>Found
            </h1>
            <p className="text-[10px] text-cyan-400/80 tracking-[0.3em] uppercase font-semibold">
              Campus Network
            </p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
          {loggedIn && (
            <>
              <Link
                to="/home"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isActive("/home")
                    ? "bg-white/10 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <FiHome className="text-lg" />
                Home
              </Link>

              <Link
                to="/messages"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  location.pathname === "/messages" ||
                  location.pathname.startsWith("/messages/")
                    ? "bg-white/10 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <FiMessageCircle className="text-lg" />
                Messages
              </Link>
            </>
          )}

          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              <FiMenu className="text-lg" />
              Menu
              <FiChevronDown className="ml-1 opacity-70 group-hover:rotate-180 transition-transform duration-300" />
            </button>

            <div className="absolute top-full right-0 mt-4 w-56 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col p-2 transform origin-top-right group-hover:translate-y-0 translate-y-2">
              {loggedIn ? (
                <>
                  <Link
                    to="/items"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all duration-300"
                  >
                    <FiList className="text-lg" />
                    All Items
                  </Link>

                  <Link
                    to="/found-items"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all duration-300"
                  >
                    <FiList className="text-lg" />
                    Found Items
                  </Link>

                  <Link
                    to="/lost-reports"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-amber-400 hover:bg-white/5 transition-all duration-300"
                  >
                    <FiFlag className="text-lg" />
                    Reported lost
                  </Link>

                  <Link
                    to="/report-lost"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-amber-400 hover:bg-white/5 transition-all duration-300"
                  >
                    <FiAlertTriangle className="text-lg" />
                    Report Lost Item
                  </Link>

                  <Link
                    to="/post-item"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-blue-400 hover:bg-white/5 transition-all duration-300"
                  >
                    <FiPlusCircle className="text-lg" />
                    Post Found Item
                  </Link>

                  {showAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-purple-400 hover:bg-white/5 transition-all duration-300"
                    >
                      <FiShield className="text-lg" />
                      Admin
                    </Link>
                  )}

                  <div className="h-px bg-white/10 my-1 mx-2" />

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                  >
                    <FiUser className="text-lg" />
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-red-400 hover:bg-white/5 transition-all duration-300 text-left"
                  >
                    <FiLogOut className="text-lg" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                  >
                    <FiUserPlus className="text-lg" />
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {showAdmin && (
            <Link
              to="/admin"
              className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive("/admin")
                  ? "bg-white/10 text-purple-300"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <FiShield className="text-lg" />
              Admin
            </Link>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-11 h-11 rounded-2xl border border-white/10 bg-white/10 text-gray-200 hover:bg-white/20 transition-all duration-300"
            aria-label="Toggle light and dark mode"
          >
            {isDarkMode ? (
              <FiSun className="text-lg text-amber-300" />
            ) : (
              <FiMoon className="text-lg text-cyan-300" />
            )}
          </button>

          {loggedIn ? (
            <Link
              to="/profile"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive("/profile")
                  ? "bg-white/10 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <FiUser className="text-lg" />
              <span className="hidden md:inline">Profile</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive("/login")
                  ? "bg-white/10 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <FiLogIn className="text-lg" />
              <span className="hidden md:inline">Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
