import { Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import HomePage from "./HomePage";
import AstrologyHome from "./astrology/AstrologyHome";
import KundaliPage from "./astrology/KundaliPage";
import MatchmakingPage from "./astrology/MatchmakingPage";
import MuhuratPage from "./astrology/MuhuratPage";
import PanchangPage from "./astrology/PanchangPage";
import AutoTranslator from "./components/AutoTranslator";
import PageBackground from "./components/PageBackground";
import RingBellSplash from "./components/RingBellSplash";
import AboutPage from "./pages/AboutPage";
import CompassPage from "./pages/CompassPage";
import DevotionalMusicPage from "./pages/DevotionalMusicPage";
import DisclaimerPage from "./pages/DisclaimerPage";
import FestivalsPage from "./pages/FestivalsPage";
import GuideOnPhonePage from "./pages/GuideOnPhonePage";
import HinduTimePage from "./pages/HinduTimePage";
import MantrasPosterPage from "./pages/MantrasPosterPage";
import MyTithiPage from "./pages/MyTithiPage";
import PanchangPosterPage from "./pages/PanchangPosterPage";
import ParchmentPreviewPage from "./pages/ParchmentPreviewPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import PurohithPage from "./pages/PurohithPage";
import SankalpMantraPage from "./pages/SankalpMantraPage";
import TemplesPage from "./pages/TemplesPage";
import RingBellPage from "./pages/RingBellPage";
import SettingsPage from "./pages/SettingsPage";
import TermsConditionsPage from "./pages/TermsConditionsPage";

export default function RouterApp() {
  return (
    <PageBackground>
      <AutoTranslator />
      <RingBellSplash
        backgroundUrl="https://i.ibb.co/pBKzKBWj/Chat-GPT-Image-Mar-11-2026-11-41-42-AM.png"
        bellSoundUrl="/audio/Low to high bell.mp3"
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/month-view" element={<App />} />
        <Route path="/festivals" element={<FestivalsPage />} />
        <Route path="/my-tithi" element={<MyTithiPage />} />
        <Route path="/hindu-time" element={<HinduTimePage />} />
        <Route path="/compass" element={<CompassPage />} />
        <Route path="/panchang-poster" element={<PanchangPosterPage />} />
        <Route path="/parchment-preview" element={<ParchmentPreviewPage />} />
        <Route path="/mantras-poster" element={<MantrasPosterPage />} />
        <Route path="/devotional-music" element={<DevotionalMusicPage />} />
        <Route path="/sankalp-mantra" element={<SankalpMantraPage />} />
        <Route path="/ring-bell" element={<RingBellPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-conditions" element={<TermsConditionsPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/purohith" element={<PurohithPage />} />
        <Route path="/temples" element={<TemplesPage />} />
        <Route path="/guide-on-phone" element={<GuideOnPhonePage />} />

        <Route path="/astrology" element={<AstrologyHome />} />
        <Route path="/kundali" element={<KundaliPage />} />
        <Route path="/matchmaking" element={<MatchmakingPage />} />
        <Route path="/muhurat" element={<MuhuratPage />} />
        <Route path="/panchang" element={<PanchangPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageBackground>
  );
}
