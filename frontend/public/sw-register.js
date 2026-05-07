const scheduleIdle =
  window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 1400));

scheduleIdle(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        console.log("SW registered:", registration);
        registration.update?.();
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  }

  if ("Notification" in window) {
    Notification.requestPermission();
  }
});
