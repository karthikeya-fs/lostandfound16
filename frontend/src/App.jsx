import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PostItem from "./pages/PostItem";
import Navbar from "./components/Navbar";
import ItemDetails from "./pages/ItemDetails";
import ForgotPassword from "./pages/ForgotPassword";
import ReportLostItem from "./pages/ReportLostItem";
import VerifyOTP from "./pages/VerifyOtp";
import ItemsList from "./pages/ItemsList";
import FoundItems from "./pages/FoundItems";
import LostReports from "./pages/LostReports";
import Profile from "./pages/Profile";

function App() {

  const isAuth = () => {
    try {
      return !!localStorage.getItem("token");
    } catch (e) {
      return false;
    }
  };

  return (
    <BrowserRouter>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #334155",
          },
        }}
      />

      <Navbar />

      <main className="min-h-screen overflow-x-hidden">
        <Routes>

          <Route path="/" element={<Login />} />

          <Route
            path="/home"
            element={
              isAuth()
                ? <Home />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/items"
            element={
              isAuth()
                ? <ItemsList />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/found-items"
            element={
              isAuth()
                ? <FoundItems />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/lost-reports"
            element={
              isAuth()
                ? <LostReports />
                : <Navigate to="/login" replace />
            }
          />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route
            path="/post-item"
            element={
              isAuth()
                ? <PostItem />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/item/:id"
            element={
              isAuth()
                ? <ItemDetails />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/report-lost"
            element={
              isAuth()
                ? <ReportLostItem />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/verify-otp"
            element={<VerifyOTP />}
          />

          <Route
            path="/profile"
            element={
              isAuth()
                ? <Profile />
                : <Navigate to="/login" replace />
            }
          />

        </Routes>
      </main>

    </BrowserRouter>
  );
}

export default App;