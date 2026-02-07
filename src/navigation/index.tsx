import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform, useColorScheme, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Spacing, Colors, Typography, BorderRadius } from '../theme';
import LoadingView from '../components/LoadingView';
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
import NotebookScreen from '../screens/NotebookScreen';
import FlashcardDecksScreen from '../screens/FlashcardDecksScreen';
import FlashcardListScreen from '../screens/FlashcardListScreen';
import FlashcardStudyScreen from '../screens/FlashcardStudyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { signOut, user } = useAuth();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ padding: Spacing.lg, backgroundColor: Colors.primary, marginBottom: Spacing.md }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md }}>
          <MaterialCommunityIcons name="account" size={36} color={Colors.white} />
        </View>
        <Text style={{ ...Typography.h3, color: Colors.white }}>{user?.fullName || 'Student'}</Text>
        <Text style={{ ...Typography.caption, color: 'rgba(255,255,255,0.7)' }}>{user?.email}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />

        <View style={{ marginTop: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.sm }}>
          <DrawerItem
            label="Logout"
            onPress={signOut}
            icon={({ color, size }) => <MaterialCommunityIcons name="logout" size={size} color={Colors.error} />}
            labelStyle={{ color: Colors.error, fontWeight: '600' }}
          />
        </View>
      </View>

      <View style={{ padding: Spacing.md, alignItems: 'center' }}>
        <Text style={{ ...Typography.caption, color: Colors.textMuted }}>Version 1.0.0</Text>
      </View>
    </DrawerContentScrollView>
  );
};

const MainDrawer = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerLabelStyle: {
          fontWeight: '600',
          fontSize: 14,
        }
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={MainTabs}
        options={{
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="Study Tools"
        component={NotebookScreen}
        options={{
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="notebook" size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="Flashcards"
        component={FlashcardDecksScreen}
        options={{
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="cards-variant" size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="bell" size={size} color={color} />
        }}
      />
      <Drawer.Screen
        name="Support"
        component={SupportScreen}
        options={{
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="help-circle" size={size} color={color} />
        }}
      />
    </Drawer.Navigator>
  );
};

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
        tabBarActiveTintColor: isDark ? Colors.primaryLight : Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: insets.bottom > 0 ? (Platform.OS === 'android' ? 100 : 85 + insets.bottom) : 68,
          paddingBottom: insets.bottom > 0 ? (Platform.OS === 'android' ? 35 : insets.bottom + 10) : 14,
          paddingTop: 12,
          backgroundColor: isDark ? '#0F172A' : Colors.white,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1E293B' : Colors.borderLight,
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

const LoadingScreen = () => <LoadingView color={Colors.primary} />;

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
          <Stack.Screen name="Main" component={MainDrawer} />
          <Stack.Screen name="ContentDetail" component={ContentDetailScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Notebook" component={NotebookScreen} />
          <Stack.Screen name="FlashcardDecks" component={FlashcardDecksScreen} />
          <Stack.Screen name="FlashcardList" component={FlashcardListScreen} />
          <Stack.Screen name="FlashcardStudy" component={FlashcardStudyScreen} />
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
