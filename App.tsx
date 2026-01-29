import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useColorScheme } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';
import Navigation, { linking } from './src/navigation';
import { initDownloads } from './src/services/downloads';

import "./global.css";

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  usePreventScreenCapture();
  const scheme = useColorScheme();

  React.useEffect(() => {
    let mounted = true;

    async function prepare() {
      try {
        await initDownloads();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        if (mounted) setAppIsReady(true);
      }
    }

    prepare();
    return () => { mounted = false; };
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        {/* ✅ Provider should wrap the whole app */}
        <AuthProvider>
          {/* ✅ NavigationContainer should directly wrap navigators */}
          <NavigationContainer
            theme={scheme === 'dark' ? DarkTheme : DefaultTheme}
            linking={linking}
          >
            <Navigation />
          </NavigationContainer>

          {/* ✅ Keep these outside the container */}
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Toast />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
