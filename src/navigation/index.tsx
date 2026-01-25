import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import AccountScreen from '../screens/AccountScreen';
import ContentDetailScreen from '../screens/ContentDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import SupportScreen from '../screens/SupportScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import * as SecureStore from 'expo-secure-store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => {
                let iconName: any;
                if (route.name === 'Home') iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
                else if (route.name === 'Library') iconName = focused ? 'book-open-variant' : 'book-open-variant';
                else if (route.name === 'Downloads') iconName = focused ? 'folder-download' : 'folder-download-outline';
                else if (route.name === 'Account') iconName = focused ? 'account' : 'account-outline';
                return <MaterialCommunityIcons name={iconName} size={24} color={color} />;
            },
            tabBarActiveTintColor: '#2563EB',
            tabBarInactiveTintColor: '#94A3B8',
            tabBarStyle: {
                height: 85,
                paddingBottom: 20,
                paddingTop: 8,
                backgroundColor: '#FFFFFF',
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
                elevation: 0,
                shadowOpacity: 0,
            },
            tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '700',
                marginTop: -4,
            }
        })}
    >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
        <Tab.Screen name="Downloads" component={DownloadsScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
);

const LoadingScreen = () => (
    <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
    </View>
);

const Navigation = () => {
    const { user, isLoading: authLoading } = useAuth();
    const [isFirstLaunch, setIsFirstLaunch] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const value = await SecureStore.getItemAsync('hasOnboarded');
                if (value === null) {
                    setIsFirstLaunch(true);
                } else {
                    setIsFirstLaunch(false);
                }
            } catch (error) {
                setIsFirstLaunch(false);
            }
        };
        checkOnboarding();
    }, []);

    if (authLoading || isFirstLaunch === null) {
        return <LoadingScreen />;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                // Auth Stack
                <Stack.Group>
                    {isFirstLaunch && (
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    )}
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </Stack.Group>
            ) : !user.verified ? (
                // Verification Stack
                <Stack.Screen
                    name="VerifyOTP"
                    component={VerifyOTPScreen}
                    initialParams={{ email: user.email }}
                />
            ) : (
                // Main App Stack
                <Stack.Group>
                    <Stack.Screen name="Main" component={MainTabs} />
                    <Stack.Screen
                        name="ContentDetail"
                        component={ContentDetailScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="Privacy" component={PrivacyScreen} />
                    <Stack.Screen name="Support" component={SupportScreen} />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
};

export default Navigation;

