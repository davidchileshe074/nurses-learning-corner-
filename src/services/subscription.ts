import { Query, ID } from 'react-native-appwrite';
import { databases, functions, APPWRITE_CONFIG } from './appwriteClient';
import { Subscription } from '../types';

export const getSubscriptionStatus = async (userId: string): Promise<Subscription | null> => {
    try {
        if (!userId) return null;

        const result = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.subscriptionsCollectionId,
            [Query.equal('userId', userId)]
        );

        if (result.documents.length === 0) return null;

        return result.documents[0] as unknown as Subscription;
    } catch (error: any) {
        if (error.code === 401 || error.code === 403) {
            console.warn('Subscription access restricted. Ensure "subscriptions" collection has Read permissions for "role:member" or the specific user.');
        } else {
            console.error('Get subscription status error:', error);
        }
        return null;
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
