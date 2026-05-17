import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "./Pages/Home";
import Pricing from "./Pages/Pricing";
import Projects from "./Pages/Projects";
import MyProjects from "./Pages/MyProjects";
import Preview from "./Pages/Preview";
import Community from "./Pages/Community";
import View from "./Pages/View";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import { Toaster } from "sonner";
import AuthPage from "./Pages/Auth/AuthPage";
import Settings from "./Pages/Settings";
import OtpPage from "./Pages/Auth/OtpPage";
import api from "./Config/axios";
import { authClient } from "./lib/auth-client";

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const hideNavBar =
    (pathname.startsWith("/projects/") && pathname !== "/projects") ||
    pathname.startsWith("/view/") ||
    pathname.startsWith("/preview/");

  useEffect(() => {
    if (isPending || !session?.user) {
      return;
    }

    const checkOtpStatus = async () => {
      try {
        const { data } = await api.get("/api/auth/otp/status");
        if (data?.required && !data?.verified && pathname !== "/auth/otp") {
          navigate("/auth/otp");
        }
        if (!data?.required && data?.verified && pathname === "/auth/otp") {
          navigate("/");
        }
      } catch (error) {
        console.error("[OTP Status Check Error]:", error);
      }
    };

    checkOtpStatus();
  }, [isPending, session?.user, pathname, navigate]);

  return (
    <>
      <Toaster />
      {!hideNavBar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/projects/:projectId" element={<Projects />} />
        <Route path="/projects" element={<MyProjects />} />
        <Route path="/preview/:projectId" element={<Preview />} />
        <Route path="/preview/:projectId/:versionId" element={<Preview />} />
        <Route path="/community" element={<Community />} />
        <Route path="/view/:projectId" element={<View />} />
        <Route path="/auth/otp" element={<OtpPage />} />
        <Route path="/auth/:pathname" element={<AuthPage />} />
        <Route path="/account/settings" element={<Settings />} />
      </Routes>
      <Footer />
    </>
  );
}
