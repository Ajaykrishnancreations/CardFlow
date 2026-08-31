import { AppRegistry } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('CardFlow', () => App);

// Run the app in the web browser
AppRegistry.runApplication('CardFlow', {
  initialProps: {},
  rootTag: document.getElementById('root')
});
