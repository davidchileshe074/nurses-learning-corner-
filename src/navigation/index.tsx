import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform, useColorScheme } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import AccountScreen from '../screens/AccountScreen';
import ContentDetailScreen from '../screens/ContentDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import SupportScreen from '../screens/SupportScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, focused }) => {
          let iconName: any;

          if (route.name === 'Home') iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          if (route.name === 'Library') iconName = focused ? 'book-open-variant' : 'book-open-page-variant-outline';
          if (route.name === 'Downloads') iconName = focused ? 'folder-download' : 'folder-download-outline';
          if (route.name === 'Account') iconName = focused ? 'account' : 'account-outline';

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
              <MaterialCommunityIcons name={iconName} size={26} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: isDark ? '#60A5FA' : '#2563EB',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: insets.bottom > 0 ? (Platform.OS === 'android' ? 100 : 85 + insets.bottom) : 68,
          paddingBottom: insets.bottom > 0 ? (Platform.OS === 'android' ? 35 : insets.bottom + 10) : 14,
          paddingTop: 12,
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
          elevation: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 2
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Downloads" component={DownloadsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

const LoadingScreen = () => {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#020617' : '#F8FAFC' }}>
      <ActivityIndicator size="large" color={isDark ? "#60A5FA" : "#2563EB"} />
    </View>
  );
};

const Navigation = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await SecureStore.getItemAsync('hasOnboarded');
        setIsFirstLaunch(value === null);
      } catch {
        setIsFirstLaunch(false);
      }
    };
    checkOnboarding();
  }, []);

  if (authLoading || isFirstLaunch === null) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Group>
          {isFirstLaunch && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Group>
      ) : !user.verified ? (
        <Stack.Screen
          name="VerifyOTP"
          component={VerifyOTPScreen}
          initialParams={{ email: user.email }}
        />
      ) : (
        <Stack.Group>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="ContentDetail" component={ContentDetailScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="Support" component={SupportScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export const linking = {
  prefixes: ['nurse-learning-corner://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

export default Navigation;
