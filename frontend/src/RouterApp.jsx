import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AutoTranslator from "./components/AutoTranslator";
import PageBackground from "./components/PageBackground";
import RingBellSplash from "./components/RingBellSplash";
import { prefetchRoutes, routeLoaders } from "./routeLoaders";

const HomePage = lazy(routeLoaders.home);
const App = lazy(routeLoaders.monthView);
const FestivalsPage = lazy(routeLoaders.festivals);
const MyTithiPage = lazy(routeLoaders.myTithi);
const HinduTimePage = lazy(routeLoaders.hinduTime);
const CompassPage = lazy(routeLoaders.compass);
const PanchangPosterPage = lazy(routeLoaders.panchangPoster);
const TodaysPanchangPage = lazy(routeLoaders.todaysPanchang);
const ParchmentPreviewPage = lazy(routeLoaders.parchmentPreview);
const MantrasPosterPage = lazy(routeLoaders.mantrasPoster);
const DevotionalMusicPage = lazy(routeLoaders.devotionalMusic);
const SankalpMantraPage = lazy(routeLoaders.sankalpMantra);
const RingBellPage = lazy(routeLoaders.ringBell);
const AboutPage = lazy(routeLoaders.about);
const SettingsPage = lazy(routeLoaders.settings);
const PrivacyPolicyPage = lazy(routeLoaders.privacyPolicy);
const TermsConditionsPage = lazy(routeLoaders.terms);
const DisclaimerPage = lazy(routeLoaders.disclaimer);
const PurohithPage = lazy(routeLoaders.purohith);
const PurohithDetailPage = lazy(routeLoaders.purohithDetail);
const AstrologersPage = lazy(routeLoaders.astrologers);
const AstrologerDetailPage = lazy(routeLoaders.astrologerDetail);
const DoshaPariharaPage = lazy(routeLoaders.doshaParihara);
const DoshaPariharaDetailPage = lazy(routeLoaders.doshaPariharaDetail);
const Days365PoojaPage = lazy(routeLoaders.days365Pooja);
const TempleDetailPage = lazy(routeLoaders.templeDetail);
const PoojaStoreDetailPage = lazy(routeLoaders.poojaStoreDetail);
const GitaPage = lazy(routeLoaders.gita);
const GitaBookmarksPage = lazy(routeLoaders.gitaBookmarks);
const TemplesPage = lazy(routeLoaders.temples);
const PoojaStoresPage = lazy(routeLoaders.poojaStores);
const GuideOnPhonePage = lazy(routeLoaders.guideOnPhone);
const AstrologyHome = lazy(routeLoaders.astrologyHome);
const KundaliPage = lazy(routeLoaders.kundali);
const MatchmakingPage = lazy(routeLoaders.matchmaking);
const MuhuratPage = lazy(routeLoaders.muhurat);
const PanchangPage = lazy(routeLoaders.panchang);

export default function RouterApp() {
  useEffect(() => {
    const scheduleIdle =
      window.requestIdleCallback ??
      ((cb) => window.setTimeout(cb, 1400));
    const cancelIdle =
      window.cancelIdleCallback ?? ((id) => window.clearTimeout(id));

    const idleId = scheduleIdle(() => {
      prefetchRoutes([
        "monthView",
        "panchang",
        "festivals",
        "myTithi",
        "hinduTime",
        "gita",
        "settings",
      ]);
    });

    return () => cancelIdle(idleId);
  }, []);

  const useWhiteText = true;

  return (
    <PageBackground className={useWhiteText ? "app-white-text" : ""}>
      <AutoTranslator />
      <RingBellSplash
        backgroundUrl="/RingBell.png"
        bellSoundUrl="/Temple bell.mp3"
      />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/month-view" element={<App />} />
          <Route path="/festivals" element={<FestivalsPage />} />
          <Route path="/my-tithi" element={<MyTithiPage />} />
          <Route path="/hindu-time" element={<HinduTimePage />} />
          <Route path="/compass" element={<CompassPage />} />
          <Route path="/panchang-poster" element={<PanchangPosterPage />} />
          <Route path="/todays-panchang" element={<TodaysPanchangPage />} />
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
          <Route path="/purohith/:purohithId" element={<PurohithDetailPage />} />
          <Route path="/astrologers" element={<AstrologersPage />} />
          <Route path="/astrologers/:serviceId" element={<AstrologerDetailPage />} />
          <Route path="/dosha-parihara" element={<DoshaPariharaPage />} />
          <Route path="/dosha-parihara/:itemId" element={<DoshaPariharaDetailPage />} />
          <Route path="/365-days-pooja" element={<Days365PoojaPage />} />
          <Route path="/gita" element={<GitaPage />} />
          <Route path="/gita/bookmarks" element={<GitaBookmarksPage />} />
          <Route path="/temples" element={<TemplesPage />} />
          <Route path="/temples/:serviceId" element={<TempleDetailPage />} />
          <Route path="/pooja-stores" element={<PoojaStoresPage />} />
          <Route path="/pooja-stores/:serviceId" element={<PoojaStoreDetailPage />} />
          <Route path="/guide-on-phone" element={<GuideOnPhonePage />} />

          <Route path="/astrology" element={<AstrologyHome />} />
          <Route path="/kundali" element={<KundaliPage />} />
          <Route path="/matchmaking" element={<MatchmakingPage />} />
          <Route path="/muhurat" element={<MuhuratPage />} />
          <Route path="/panchang" element={<PanchangPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </PageBackground>
  );
}
