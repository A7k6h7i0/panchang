import { Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import HomePage from "./HomePage";
import AstrologyHome from "./astrology/AstrologyHome";
import KundaliPage from "./astrology/KundaliPage";
import MatchmakingPage from "./astrology/MatchmakingPage";
import MuhuratPage from "./astrology/MuhuratPage";
import PanchangPage from "./astrology/PanchangPage";
import FestivalsPage from "./pages/FestivalsPage";
import MyTithiPage from "./pages/MyTithiPage";
import HinduTimePage from "./pages/HinduTimePage";
import CompassPage from "./pages/CompassPage";
import SankalpMantraPage from "./pages/SankalpMantraPage";
import AboutPage from "./pages/AboutPage";
import InfoPage from "./pages/InfoPage";
import SettingsPage from "./pages/SettingsPage";

export default function RouterApp() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/month-view" element={<App />} />
      <Route path="/festivals" element={<FestivalsPage />} />
      <Route path="/my-tithi" element={<MyTithiPage />} />
      <Route path="/hindu-time" element={<HinduTimePage />} />
      <Route path="/compass" element={<CompassPage />} />
      <Route path="/sankalp-mantra" element={<SankalpMantraPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/info" element={<InfoPage />} />
      <Route path="/settings" element={<SettingsPage />} />

      <Route path="/astrology" element={<AstrologyHome />} />
      <Route path="/kundali" element={<KundaliPage />} />
      <Route path="/matchmaking" element={<MatchmakingPage />} />
      <Route path="/muhurat" element={<MuhuratPage />} />
      <Route path="/panchang" element={<PanchangPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
