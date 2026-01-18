import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadow } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ContentDetailScreen from '../screens/ContentDetailScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import AccountScreen from '../screens/AccountScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
                let iconName: any;
                if (route.name === 'Home') iconName = 'view-dashboard-outline';
                else if (route.name === 'Library') iconName = 'book-open-variant';
                else if (route.name === 'Downloads') iconName = 'folder-download-outline';
                else if (route.name === 'Account') iconName = 'account-circle-outline';
                return <MaterialCommunityIcons name={iconName} size={24} color={color} />;
            },
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textLighter,
            tabBarStyle: {
                height: 60,
                paddingBottom: 10,
                paddingTop: 8,
                backgroundColor: Colors.white,
                borderTopWidth: 1,
                borderTopColor: Colors.borderLight,
                ...Shadow.medium,
            },
            tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '600',
            }
        })}
    >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
        <Tab.Screen name="Downloads" component={DownloadsScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
);

const Navigation = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="small" color={Colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        {!user.verified ? (
                            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} initialParams={{ email: user.email }} />
                        ) : (
                            <>
                                <Stack.Screen name="Main" component={MainTabs} />
                                <Stack.Screen name="ContentDetail" component={ContentDetailScreen} options={{ headerShown: false }} />
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;

