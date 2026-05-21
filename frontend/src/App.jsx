import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PostItem from "./pages/PostItem";
import Navbar from "./components/Navbar";
import ItemDetails from "./pages/ItemDetails";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOtp";
import ReportLostItem from "./pages/ReportLostItem";
import ItemsList from "./pages/ItemsList";
import FoundItems from "./pages/FoundItems";
import LostReports from "./pages/LostReports";
import Profile from "./pages/Profile";
import ChatLayout from "./layouts/ChatLayout";
import Messages from "./pages/Messages";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { isAdmin, isAuthenticated } from "./utils/authStorage";

function App() {
  const isAuth = () => isAuthenticated();

  return (
    <BrowserRouter>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#0f172a",
            color: "#ffffff",
            border: "1px solid #334155",
            borderRadius: "14px",
            padding: "14px",
          },
        }}
      />

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="min-h-screen overflow-x-hidden">
        <Routes>

          {/* Default Route */}
          <Route
            path="/"
            element={
              isAuth()
                ? <Navigate to="/home" replace />
                : <Login />
            }
          />

          {/* Login — always reachable so users can sign in as another account or recover from a stale token */}
          <Route path="/login" element={<Login />} />

          {/* Register — always reachable */}
          <Route path="/register" element={<Register />} />

          {/* Verify OTP (after register) */}
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* Home */}
          <Route
            path="/home"
            element={
              isAuth()
                ? <Home />
                : <Navigate to="/login" replace />
            }
          />

          {/* Items */}
          <Route
            path="/items"
            element={
              isAuth()
                ? <ItemsList />
                : <Navigate to="/login" replace />
            }
          />

          {/* Found Items */}
          <Route
            path="/found-items"
            element={
              isAuth()
                ? <FoundItems />
                : <Navigate to="/login" replace />
            }
          />

          {/* Lost Reports */}
          <Route
            path="/lost-reports"
            element={
              isAuth()
                ? <LostReports />
                : <Navigate to="/login" replace />
            }
          />

          {/* Post Item */}
          <Route
            path="/post-item"
            element={
              isAuth()
                ? <PostItem />
                : <Navigate to="/login" replace />
            }
          />

          {/* Item Details */}
          <Route
            path="/item/:id"
            element={
              isAuth()
                ? <ItemDetails />
                : <Navigate to="/login" replace />
            }
          />

          {/* Report Lost */}
          <Route
            path="/report-lost"
            element={
              isAuth()
                ? <ReportLostItem />
                : <Navigate to="/login" replace />
            }
          />

          {/* Forgot Password */}
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          {/* Messaging — single ChatLayout keeps Socket.io alive across list + room */}
          <Route
            path="messages"
            element={
              isAuth() ? (
                <ChatLayout />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route index element={<Messages />} />
            <Route path=":roomId" element={<Messages />} />
          </Route>

          {/* Profile */}
          <Route
            path="/profile"
            element={
              isAuth()
                ? <Profile />
                : <Navigate to="/login" replace />
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              isAuth() && isAdmin()
                ? <AdminDashboard />
                : <Navigate to={isAuth() ? "/home" : "/login"} replace />
            }
          />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-2xl font-bold">
                404 | Page Not Found
              </div>
            }
          />

        </Routes>
      </main>

    </BrowserRouter>
  );
}

export default App;