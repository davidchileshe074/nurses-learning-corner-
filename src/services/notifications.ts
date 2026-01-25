import * as SecureStore from 'expo-secure-store';
import { AppNotification, ContentItem, Subscription } from '../types';
import { getContent } from './content';

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
};

export const markAsRead = async (id: string) => {
    const notifications = await getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    await saveNotifications(updated);
};

export const clearAllNotifications = async () => {
    await SecureStore.deleteItemAsync(NOTIFICATIONS_KEY);
};

export const checkAndGenerateNotifications = async (user: any, subscription: Subscription | null) => {
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
                message: `Your premium access will expire in ${diffDays} days. Renew now to avoid losing access to your materials.`,
                type: 'SUBSCRIPTION'
            });
            await SecureStore.setItemAsync(LAST_EXPIRY_CHECK_KEY, today);
        }
    }

    // 2. Check for New Content
    try {
        const latestContent = await getContent(user.program, user.yearOfStudy, undefined, undefined);
        if (latestContent.length > 0) {
            const lastContentId = await SecureStore.getItemAsync(LAST_CONTENT_ID_KEY);
            const mostRecent = latestContent[0]; // Assuming getContent returns sorted by date

            if (lastContentId && lastContentId !== mostRecent.$id) {
                // Count how many are new
                const lastIndex = latestContent.findIndex(c => c.$id === lastContentId);
                const newCount = lastIndex === -1 ? latestContent.length : lastIndex;

                if (newCount > 0) {
                    await addNotification({
                        title: 'New Study Materials',
                        message: `We've just added ${newCount} new ${newCount === 1 ? 'resource' : 'resources'} for your current level.`,
                        type: 'CONTENT'
                    });
                }
            }

            // Always update lastContentId to the most recent one we've seen
            await SecureStore.setItemAsync(LAST_CONTENT_ID_KEY, mostRecent.$id);
        }
    } catch (error) {
        console.error('Error checking for new content:', error);
    }
};
