import { AppRegistry } from 'react-native';
import App from './App';
import { colors } from './theme';

// Register the app
AppRegistry.registerComponent('CardFlow', () => App);

document.documentElement.style.backgroundColor = colors.bgMuted;
document.body.style.backgroundColor = colors.bgMuted;

// Run the app in the web browser
AppRegistry.runApplication('CardFlow', {
  initialProps: {},
  rootTag: document.getElementById('root')
});
