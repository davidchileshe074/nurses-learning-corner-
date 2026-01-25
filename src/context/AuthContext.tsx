import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { getCurrentUser, signOut as appwriteSignOut } from '../services/auth';
import { getDeviceId, bindDeviceToProfile } from '../services/device';
import { Alert } from 'react-native';
import { getSubscriptionStatus, checkSubscriptionExpiry } from '../services/subscription';

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

    const checkDeviceBinding = async (profile: UserProfile): Promise<boolean> => {
        const currentDeviceId = await getDeviceId();

        if (!profile.deviceId) {
            // First time login on this device or binding not set
            // In a real flow, we'd bind it here after OTP
            return true;
        }

        if (profile.deviceId !== currentDeviceId) {
            Alert.alert(
                'Access Blocked',
                'Account already used on another device. Contact admin.',
                [{ text: 'OK' }]
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
                            // Fetch document ID from $id since it's an Appwrite document
                            const profileDocId = (currentUser as any).$id;
                            await bindDeviceToProfile(profileDocId, currentDeviceId);
                            // Update local state with new deviceId
                            currentUser.deviceId = currentDeviceId;
                        } catch (e) {
                            console.error('Failed to auto-bind device:', e);
                        }
                    }
                    setUser(currentUser);
                } else {
                    await appwriteSignOut();
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Auth sync error:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        syncUser();

        // Periodic subscription check every 6 hours
        const interval = setInterval(async () => {
            if (user) {
                const sub = await getSubscriptionStatus(user.userId);
                if (!checkSubscriptionExpiry(sub)) {
                    syncUser(); // Re-sync to reflect expired status
                }
            }
        }, 6 * 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, []); // Run only on mount to prevent infinite loop with syncUser

    const signOut = async () => {
        try {
            await appwriteSignOut();
            setUser(null);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, setUser, checkDeviceBinding, signOut }}>
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
