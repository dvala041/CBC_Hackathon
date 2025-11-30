import { AppRegistry, Platform } from 'react-native';
import ShareExtension from './components/ShareExtension';

// Register the share extension component
AppRegistry.registerComponent('shareExtension', () => ShareExtension);

// For iOS, also send close notifications
if (Platform.OS === 'ios') {
  // Make NativeEventEmitter available globally for the share extension
  const { NativeEventEmitter } = require('react-native');
  const eventEmitter = new NativeEventEmitter();

  // Export a close function that can be called from anywhere
  global.closeShareExtension = () => {
    eventEmitter.emit('close');
  };
}
