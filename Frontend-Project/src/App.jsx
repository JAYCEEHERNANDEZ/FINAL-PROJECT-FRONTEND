import { BrowserRouter, Routes, Route } from "react-router-dom";
import Adminlogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ResidentLogin from './pages/ResidentLogin.jsx'
import ResidentDashboard from "./pages/ResidentDashboard.jsx";
import MeterReaderLogin from "./pages/MeterReaderLogin.jsx";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-login" element={<Adminlogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/resident-login" element={<ResidentLogin />} />
        <Route path="/meter-reader" element={<MeterReaderLogin />} />
        <Route path="/resident-dashboard" element={<ResidentDashboard />} />
        </Routes>
    </BrowserRouter>
  );
}
