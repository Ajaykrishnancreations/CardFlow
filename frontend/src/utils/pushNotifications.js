// Local push notifications for the native Android/iOS shell (Capacitor).
// No-op everywhere else (regular web/browser use).

const PREFS_KEY = 'cf_notification_prefs';
const PROMO_SENT_KEY = 'cf_promo_notification_sent';

// How far apart the recurring test notifications fire. The product ask was
// "every 5 minutes" specifically for testing this feature end-to-end.
const TEST_INTERVAL_MS = 5 * 60 * 1000;
const TEST_OCCURRENCES = 24; // 2 hours' worth per enabled category

const MESSAGES = {
  exploreBusiness: {
    title: 'CardFlow',
    body: 'Hey! Explore new businesses and improve your circle.'
  },
  addBusiness: {
    title: 'CardFlow',
    body: 'Add your business to get more clients.'
  }
};

const DEFAULT_PREFS = { exploreBusiness: true, addBusiness: true };

export function isNativePlatform() {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}

export function getNotificationPrefs() {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(prefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    // ignore
  }
}

async function getPlugin() {
  if (!isNativePlatform()) return null;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

export async function requestNotificationPermission() {
  const plugin = await getPlugin();
  if (!plugin) return false;
  const status = await plugin.requestPermissions();
  return status.display === 'granted';
}

// (Re)builds the scheduled queue from scratch based on current prefs —
// simplest way to keep it in sync whenever a toggle changes.
export async function rescheduleTestNotifications(prefs = getNotificationPrefs()) {
  const plugin = await getPlugin();
  if (!plugin) return;

  const pending = await plugin.getPending();
  const testIds = (pending?.notifications || [])
    .map((n) => n.id)
    .filter((id) => id >= 1000 && id < 100000);
  if (testIds.length) {
    await plugin.cancel({ notifications: testIds.map((id) => ({ id })) });
  }

  const categories = Object.keys(MESSAGES).filter((key) => prefs[key]);
  if (categories.length === 0) return;

  const now = Date.now();
  const notifications = [];
  let id = 1000;
  for (let i = 1; i <= TEST_OCCURRENCES; i++) {
    for (const category of categories) {
      const msg = MESSAGES[category];
      notifications.push({
        id: id++,
        title: msg.title,
        body: msg.body,
        schedule: { at: new Date(now + i * TEST_INTERVAL_MS) }
      });
    }
  }
  await plugin.schedule({ notifications });
}

export async function setNotificationPref(key, enabled) {
  const prefs = { ...getNotificationPrefs(), [key]: enabled };
  savePrefs(prefs);
  await rescheduleTestNotifications(prefs);
  return prefs;
}

// One-off promo for the new Subscription plans — fires shortly after
// notifications are first enabled, not repeated on every launch.
export async function sendSubscriptionPromoOnce() {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    if (window.localStorage.getItem(PROMO_SENT_KEY) === '1') return;
  } catch (e) {
    // fall through and send anyway
  }
  await plugin.schedule({
    notifications: [
      {
        id: 999,
        title: 'CardFlow',
        body: 'Hey! Check out our Subscription plans and get premium features.',
        schedule: { at: new Date(Date.now() + 10 * 1000) }
      }
    ]
  });
  try {
    window.localStorage.setItem(PROMO_SENT_KEY, '1');
  } catch (e) {
    // ignore
  }
}

// Call once at app startup: requests permission if needed, then (re)arms
// the test schedule and the one-off subscription promo when enabled.
export async function initPushNotifications() {
  if (!isNativePlatform()) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  const prefs = getNotificationPrefs();
  await rescheduleTestNotifications(prefs);
  if (prefs.exploreBusiness || prefs.addBusiness) {
    await sendSubscriptionPromoOnce();
  }
}
