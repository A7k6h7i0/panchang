const prefetchCache = new Set();

export const routeLoaders = {
  home: () => import("./HomePage"),
  monthView: () => import("./App"),
  festivals: () => import("./pages/FestivalsPage"),
  myTithi: () => import("./pages/MyTithiPage"),
  hinduTime: () => import("./pages/HinduTimePage"),
  compass: () => import("./pages/CompassPage"),
  panchangPoster: () => import("./pages/PanchangPosterPage"),
  todaysPanchang: () => import("./pages/TodaysPanchangPage"),
  parchmentPreview: () => import("./pages/ParchmentPreviewPage"),
  mantrasPoster: () => import("./pages/MantrasPosterPage"),
  devotionalMusic: () => import("./pages/DevotionalMusicPage"),
  sankalpMantra: () => import("./pages/SankalpMantraPage"),
  ringBell: () => import("./pages/RingBellPage"),
  about: () => import("./pages/AboutPage"),
  settings: () => import("./pages/SettingsPage"),
  privacyPolicy: () => import("./pages/PrivacyPolicyPage"),
  terms: () => import("./pages/TermsConditionsPage"),
  disclaimer: () => import("./pages/DisclaimerPage"),
  purohith: () => import("./pages/PurohithPage"),
  purohithDetail: () => import("./pages/PurohithDetailPage"),
  astrologers: () => import("./pages/AstrologersPage"),
  astrologerDetail: () => import("./pages/AstrologerDetailPage"),
  doshaParihara: () => import("./pages/DoshaPariharaPage"),
  doshaPariharaDetail: () => import("./pages/DoshaPariharaDetailPage"),
  days365Pooja: () => import("./pages/Days365PoojaPage"),
  templeDetail: () => import("./pages/TempleDetailPage"),
  poojaStoreDetail: () => import("./pages/PoojaStoreDetailPage"),
  gita: () => import("./features/gita/pages/GitaPage"),
  gitaBookmarks: () => import("./features/gita/pages/GitaBookmarksPage"),
  temples: () => import("./pages/TemplesPage"),
  poojaStores: () => import("./pages/PoojaStoresPage"),
  guideOnPhone: () => import("./pages/GuideOnPhonePage"),
  astrologyHome: () => import("./astrology/AstrologyHome"),
  kundali: () => import("./astrology/KundaliPage"),
  matchmaking: () => import("./astrology/MatchmakingPage"),
  muhurat: () => import("./astrology/MuhuratPage"),
  panchang: () => import("./astrology/PanchangPage"),
};

export function prefetchRoute(key) {
  const loader = routeLoaders[key];
  if (!loader || prefetchCache.has(key)) return;
  prefetchCache.add(key);
  loader();
}

export function prefetchRoutes(keys) {
  keys.forEach((key) => prefetchRoute(key));
}
