import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  NativeModules,
} from 'react-native';

interface ShareExtensionProps {
  url?: string;
  text?: string;
}

export default function ShareExtension(props: ShareExtensionProps) {
  const [isOpening, setIsOpening] = useState(true);
  const sharedUrl = props.url || props.text || '';

  // Automatically open the main app with the shared URL
  React.useEffect(() => {
    const openMainApp = () => {
      if (!sharedUrl) {
        closeExtension();
        return;
      }

      if (Platform.OS === 'ios') {
        try {
          const { ShareExtensionModule } = NativeModules;

          if (ShareExtensionModule && ShareExtensionModule.openHostApp) {
            // Open the main app with the shared URL as a parameter
            const path = `/?sharedUrl=${encodeURIComponent(sharedUrl)}`;
            ShareExtensionModule.openHostApp(path);
          } else {
            console.log('ShareExtensionModule.openHostApp not found, available methods:', Object.keys(ShareExtensionModule || {}));
            closeExtension();
          }
        } catch (error) {
          console.error('Error opening main app:', error);
          closeExtension();
        }
      }
    };

    // Small delay to ensure the extension is fully loaded
    const timer = setTimeout(openMainApp, 300);
    return () => clearTimeout(timer);
  }, [sharedUrl]);

  const closeExtension = () => {
    // Send notification to native code to close the share extension
    if (Platform.OS === 'ios') {
      try {
        const { ShareExtensionModule } = NativeModules;

        if (ShareExtensionModule && ShareExtensionModule.close) {
          ShareExtensionModule.close();
        } else {
          console.log('ShareExtensionModule.close not found');
        }
      } catch (error) {
        console.error('Error closing extension:', error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <ActivityIndicator size="large" color="#2196F3" />
        <Text className="text-gray-600 mt-4 text-center">
          Opening ReelSummarizer...
        </Text>
      </View>
    </SafeAreaView>
  );
}
