import { Query, ID } from 'react-native-appwrite';
import { databases, functions, APPWRITE_CONFIG } from './appwriteClient';
import { Subscription } from '../types';
import * as FileSystem from 'expo-file-system/legacy';

const SUB_CACHE_FILE = `${FileSystem.cacheDirectory}sub_status_cache.json`;

const saveSubToCache = async (sub: Subscription | null) => {
    try {
        await FileSystem.writeAsStringAsync(SUB_CACHE_FILE, JSON.stringify(sub));
    } catch (e) {
        console.warn('[SubCache] Save Error:', e);
    }
};

const getSubFromCache = async (): Promise<Subscription | null> => {
    try {
        const info = await FileSystem.getInfoAsync(SUB_CACHE_FILE);
        if (info.exists) {
            const content = await FileSystem.readAsStringAsync(SUB_CACHE_FILE);
            return JSON.parse(content);
        }
    } catch (e) {
        console.warn('[SubCache] Read Error:', e);
    }
    return null;
};

export const getSubscriptionStatus = async (userId: string): Promise<Subscription | null> => {
    try {
        if (!userId) return null;

        const result = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.subscriptionsCollectionId,
            [Query.equal('userId', userId)]
        );

        const sub = result.documents.length === 0 ? null : (result.documents[0] as unknown as Subscription);

        // Cache it
        saveSubToCache(sub);

        return sub;
    } catch (error: any) {
        console.error('Get subscription status error (checking cache):', error.message);
        return getSubFromCache();
    }
};


export const redeemAccessCode = async (code: string, userId: string) => {
    try {
        const result = await functions.createExecution(
            '696d86190027bc7e3e2a', // Your actual function ID
            JSON.stringify({ code, userId })
        );

        // Debug log to see why parsing might fail
        console.log('[DEBUG] Function Result:', {
            status: result.status,
            responseBody: result.responseBody,
            errors: result.errors
        });

        if (!result.responseBody) {
            throw new Error(`Function returned empty response. Status: ${result.status}`);
        }

        return JSON.parse(result.responseBody);
    } catch (error: any) {
        console.error('Redeem access code error:', error);
        throw new Error(error.message);
    }
};

export const checkSubscriptionExpiry = (subscription: Subscription | null): boolean => {
    if (!subscription) return false;
    if (subscription.status === 'EXPIRED') return false;

    const expiryDate = new Date(subscription.endDate);
    const now = new Date();

    return expiryDate > now;
};
