let configCache = null;
let configLoadingPromise = null;

export const loadConfig = async () => {
  if (configCache) return configCache;
  if (configLoadingPromise) return configLoadingPromise;

  configLoadingPromise = (async () => {
    try {
      const mod = await import("../../knowledge/config.json");
      const config = mod?.default ?? mod;

      if (!config || typeof config !== "object") {
        throw new Error("Invalid config.json: expected a JSON object");
      }

      configCache = config;
      return config;
    } catch (error) {
      // Allow retries on subsequent calls
      configLoadingPromise = null;

      const message =
        error?.message ||
        "Failed to load configuration. Ensure `frontend/knowledge/config.json` exists and is valid JSON.";

      throw new Error(message);
    }
  })();

  return configLoadingPromise;
};

loadConfig().catch((err) => {
  console.error("⚠️ configLoader: ", err?.message || err);
});

export const getConfig = (section, key, defaultValue) => {
  if (!configCache) {
    throw new Error(
      "Configuration not loaded. Call `await loadConfig()` during startup (and ensure `frontend/knowledge/config.json` exists)."
    );
  }

  if (!section) return configCache;
  if (!key) return configCache[section] ?? defaultValue;
  return configCache?.[section]?.[key] ?? defaultValue;
};

export const getPersonalInfo = () => getConfig("personal");
export const getSocialLinks = () => getConfig("social");
export const getChatConfig = () => getConfig("chat");
export const getContentConfig = () => getConfig("content");
