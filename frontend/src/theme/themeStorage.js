const STORAGE_KEY = 'cf_theme_prefs';

export function loadThemePrefs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

export function saveThemePrefs(prefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    // localStorage unavailable — theme falls back to defaults on next load
  }
}

export function clearThemePrefs() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // no-op
  }
}
