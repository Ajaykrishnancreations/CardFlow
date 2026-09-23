import { AppRegistry } from 'react-native';
import App from './App';
import { colors } from './theme';
import { initPushNotifications } from './utils/pushNotifications';

// Register the app
AppRegistry.registerComponent('CardFlow', () => App);

document.documentElement.style.backgroundColor = colors.bgMuted;
document.body.style.backgroundColor = colors.bgMuted;

// Run the app in the web browser
AppRegistry.runApplication('CardFlow', {
  initialProps: {},
  rootTag: document.getElementById('root')
});

// Native shell only (no-op on web) — just requests notification permission
// early. AuthContext schedules the actual reminders once it knows whether
// the user is logged out, logged in free, or logged in premium.
initPushNotifications();
