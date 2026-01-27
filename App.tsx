import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import Navigation, { linking } from './src/navigation/index';
import { initDownloads } from './src/services/downloads';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useColorScheme } from 'react-native';
import "./global.css";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  // 1. Prevent Screen Capture globally for security
  usePreventScreenCapture();

  // 2. Adapt to System Theme
  const scheme = useColorScheme();

  React.useEffect(() => {
    async function prepare() {
      try {
        // Initialize downloads
        await initDownloads();

        // Artificially delay for 2 seconds to show splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately!
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NavigationContainer
          onReady={() => console.log('Navigation Container Ready')}
          theme={scheme === 'dark' ? DarkTheme : DefaultTheme}
          linking={linking}
        >
          <AuthProvider>
            <Navigation />
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
      <Toast />
    </GestureHandlerRootView>
  );
}
