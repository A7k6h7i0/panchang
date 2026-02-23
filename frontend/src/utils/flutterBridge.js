export function hasFlutterChannel() {
  if (typeof window === "undefined") return false;
  return Boolean(window.FlutterChannel && typeof window.FlutterChannel.postMessage === "function");
}

export function postFlutterMessage(payload) {
  if (!hasFlutterChannel()) return false;
  try {
    window.FlutterChannel.postMessage(JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error("Flutter bridge postMessage failed:", error);
    return false;
  }
}

