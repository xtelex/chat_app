import { BrowserRouter, Route, Routes } from "react-router-dom";

import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen text-slate-100">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
