import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { AppNotification, Subscription, UserProfile } from '../types';
import { getContent } from './content';
import { updateUserProfile } from './auth';

// Configure how notifications are handled when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const NOTIFICATIONS_KEY = 'nlc_notifications';
const LAST_CONTENT_ID_KEY = 'nlc_last_content_id';
const LAST_EXPIRY_CHECK_KEY = 'nlc_last_expiry_check';

export const getNotifications = async (): Promise<AppNotification[]> => {
    try {
        const stored = await SecureStore.getItemAsync(NOTIFICATIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

export const saveNotifications = async (notifications: AppNotification[]) => {
    try {
        await SecureStore.setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
};

export const addNotification = async (notif: Omit<AppNotification, 'id' | 'isRead' | 'date'>) => {
    const notifications = await getNotifications();
    const newNotif: AppNotification = {
        ...notif,
        id: Math.random().toString(36).substr(2, 9),
        isRead: false,
        date: new Date().toISOString()
    };
    await saveNotifications([newNotif, ...notifications]);

    // Also trigger a local push notification immediately for visibility
    await Notifications.scheduleNotificationAsync({
        content: {
            title: newNotif.title,
            body: newNotif.message,
            data: { type: newNotif.type },
        },
        trigger: null, // show immediately
    });
};

export const markAsRead = async (id: string) => {
    const notifications = await getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    await saveNotifications(updated);
};

export const clearAllNotifications = async () => {
    await SecureStore.deleteItemAsync(NOTIFICATIONS_KEY);
};

export const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return undefined;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return undefined;
    }

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
            // projectId: 'your-project-id' // Optional for simple managed workflows
        });
        const token = tokenData.data;
        console.log('Push Token:', token);
        return token;
    } catch (error) {
        console.error('Error fetching push token:', error);
        return undefined;
    }
};

export const bindPushTokenToUser = async (profileId: string, token: string) => {
    try {
        console.log('Binding push token to user profile:', profileId);
        await updateUserProfile(profileId, { pushToken: token });
    } catch (error) {
        console.error('Failed to bind push token:', error);
    }
};

export const checkAndGenerateNotifications = async (user: UserProfile, subscription: Subscription | null) => {
    if (!user) return;

    // 1. Check for Subscription Expiry (1 week before)
    if (subscription?.endDate) {
        const now = new Date();
        const expiry = new Date(subscription.endDate);
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const lastCheck = await SecureStore.getItemAsync(LAST_EXPIRY_CHECK_KEY);
        const today = new Date().toISOString().split('T')[0];

        if (diffDays <= 7 && diffDays > 0 && lastCheck !== today) {
            await addNotification({
                title: 'Membership Expiring Soon',
                message: `Your premium access will expire in ${diffDays} days. Renew now to avoid losing access.`,
                type: 'SUBSCRIPTION'
            });
            await SecureStore.setItemAsync(LAST_EXPIRY_CHECK_KEY, today);
        }
    }

    // 2. Check for New Content
    try {
        // Correctly handle the response format { documents: [...] }
        const { documents: latestContent } = await getContent(user.program, user.yearOfStudy, undefined, undefined);

        if (latestContent && latestContent.length > 0) {
            const lastContentId = await SecureStore.getItemAsync(LAST_CONTENT_ID_KEY);
            const mostRecent = latestContent[0]; // Assuming sorted by date descending

            if (latestContent.length > 0 && (!lastContentId || lastContentId !== mostRecent.$id)) {
                // If we have a stored ID, try to find how many are new since then
                let newCount = 0;
                if (lastContentId) {
                    const lastIndex = latestContent.findIndex(c => c.$id === lastContentId);
                    newCount = lastIndex === -1 ? latestContent.length : lastIndex;
                } else {
                    // First time check, maybe don't spam 10 notifications? Just say "New content available"
                    newCount = 1;
                }

                if (newCount > 0) {
                    await addNotification({
                        title: 'New Study Materials',
                        message: `We've just added ${newCount} new ${newCount === 1 ? 'resource' : 'resources'} for your current level.`,
                        type: 'CONTENT'
                    });
                }

                // Always update lastContentId to the most recent one we've seen
                await SecureStore.setItemAsync(LAST_CONTENT_ID_KEY, mostRecent.$id);
            }
        }
    } catch (error) {
        console.error('Error checking for new content:', error);
    }
};
