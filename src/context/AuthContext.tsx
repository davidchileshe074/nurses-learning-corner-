import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { getCurrentUser, signOut as appwriteSignOut } from '../services/auth';
import { getDeviceId, bindDeviceToProfile } from '../services/device';
import { Alert, AppState } from 'react-native';
import { getSubscriptionStatus, checkSubscriptionExpiry } from '../services/subscription';
import { registerForPushNotificationsAsync, bindPushTokenToUser } from '../services/notifications';
import * as FileSystem from 'expo-file-system/legacy';

const USER_CACHE_FILE = `${FileSystem.cacheDirectory}user_profile_cache.json`;

const saveUserToCache = async (user: UserProfile | null) => {
    try {
        await FileSystem.writeAsStringAsync(USER_CACHE_FILE, JSON.stringify(user));
    } catch (e) {
        console.warn('[UserCache] Save Error:', e);
    }
};

const getUserFromCache = async (): Promise<UserProfile | null> => {
    try {
        const info = await FileSystem.getInfoAsync(USER_CACHE_FILE);
        if (info.exists) {
            const content = await FileSystem.readAsStringAsync(USER_CACHE_FILE);
            return JSON.parse(content);
        }
    } catch (e) {
        console.warn('[UserCache] Read Error:', e);
    }
    return null;
};

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    setUser: (user: UserProfile | null) => void;
    checkDeviceBinding: (user: UserProfile) => Promise<boolean>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const signOut = async () => {
        try {
            await appwriteSignOut();
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            await saveUserToCache(null);
            setUser(null);
        }
    };

    const checkDeviceBinding = async (profile: UserProfile): Promise<boolean> => {
        const currentDeviceId = await getDeviceId();

        if (!profile.deviceId) {
            // First time login on this device or binding not set
            return true;
        }

        if (profile.deviceId !== currentDeviceId) {
            Alert.alert(
                'Device Access Restricted',
                'For security reasons, your account is locked to the primary device you register with.',
                [{ text: 'OK', onPress: () => signOut() }]
            );
            return false;
        }

        return true;
    };

    const syncUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                const isDeviceValid = await checkDeviceBinding(currentUser);
                if (isDeviceValid) {
                    if (!currentUser.deviceId) {
                        const currentDeviceId = await getDeviceId();
                        try {
                            const profileDocId = (currentUser as any).$id;
                            await bindDeviceToProfile(profileDocId, currentDeviceId);
                            currentUser.deviceId = currentDeviceId;
                        } catch (e) {
                            console.error('Failed to auto-bind device:', e);
                        }
                    }

                    setUser(currentUser);
                    await saveUserToCache(currentUser);

                    try {
                        const token = await registerForPushNotificationsAsync();
                        if (token && currentUser.pushToken !== token) {
                            await bindPushTokenToUser(currentUser.$id, token);
                            setUser(prev => prev ? { ...prev, pushToken: token } : null);
                        }
                    } catch (pushError) {
                        console.log('Push notification registration failed (non-blocking):', pushError);
                    }

                } else {
                    await signOut();
                }
            } else {
                // If Appwrite returns null (no session or network error), check cache
                const cachedUser = await getUserFromCache();
                if (cachedUser) {
                    console.log('Using cached user profile (Offline Mode)');
                    setUser(cachedUser);
                } else {
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Auth sync error (checking cache):', error);
            const cachedUser = await getUserFromCache();
            if (cachedUser) {
                setUser(cachedUser);
            } else {
                setUser(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        syncUser();

        // Check verification on app foreground
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                syncUser();
            }
        });

        // Periodic subscription check every 6 hours
        const interval = setInterval(async () => {
            // Fetch fresh user data to avoid stale closures
            const currentUser = await getCurrentUser();
            if (currentUser) {
                const sub = await getSubscriptionStatus(currentUser.userId);
                if (!checkSubscriptionExpiry(sub)) {
                    syncUser(); // Re-sync to reflect expired status
                }
            }
        }, 6 * 60 * 60 * 1000);

        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            setUser,
            checkDeviceBinding,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
