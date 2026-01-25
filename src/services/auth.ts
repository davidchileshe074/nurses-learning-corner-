import { ID, Query } from 'react-native-appwrite';
import { account, databases, APPWRITE_CONFIG } from './appwriteClient';
import { UserProfile, Program, YearOfStudy } from '../types';

export const signUp = async (
    email: string,
    password: string,
    fullName: string,
    whatsappNumber: string,
    yearOfStudy: YearOfStudy,
    program: Program
) => {
    try {
        // 0. Clear any existing session first
        try {
            await account.deleteSession('current');
        } catch (e) {
            // Ignore if no session exists
        }

        // 1. Create Appwrite Account
        const newAccount = await account.create(ID.unique(), email, password, fullName);

        if (!newAccount) throw Error('Account creation failed');

        // 2. Log in to get session (required to create document if permissions are set to owner)
        await account.createEmailPasswordSession(email, password);

        // 3. Create profile document
        const profile = await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.profilesCollectionId,
            ID.unique(),
            {
                userId: newAccount.$id,
                fullName,
                email,
                whatsappNumber,
                yearOfStudy,
                program,
                verified: false,
                adminApproved: true,
            }
        );

        return profile;
    } catch (error: any) {
        console.error('Sign Up Error:', error);

        // Provide more specific error messages
        if (error.message?.includes('already exists')) {
            throw new Error('An account with this email already exists. Please sign in instead.');
        } else if (error.message?.includes('password')) {
            throw new Error('Password must be at least 8 characters long.');
        } else {
            throw new Error(error.message || 'Registration failed. Please try again.');
        }
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        // Clear any existing session first
        try {
            await account.deleteSession('current');
        } catch (e) {
            // Ignore if no session exists
        }

        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (error: any) {
        console.error('Sign In Error:', error);

        // Provide more specific error messages
        if (error.message?.includes('Invalid credentials')) {
            throw new Error('Invalid email or password. Please try again.');
        } else {
            throw new Error(error.message || 'Sign in failed. Please try again.');
        }
    }
};

export const signOut = async () => {
    try {
        await account.deleteSession('current');
    } catch (error: any) {
        console.error('Sign Out Error:', error);
        throw new Error(error.message);
    }
};

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if (!currentAccount) return null;

        const currentUser = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.profilesCollectionId,
            [Query.equal('userId', currentAccount.$id)]
        );

        if (currentUser.documents.length === 0) return null;

        return currentUser.documents[0] as unknown as UserProfile;
    } catch (error: any) {
        // Code 401 means the user is not logged in (guest), which is expected
        if (error.code !== 401) {
            console.error('Get Current User Error:', error);
        }
        return null;
    }
};

export const sendPhoneOTP = async (phone: string, userId: string = ID.unique()) => {
    try {
        return await account.createPhoneToken(userId, phone);
    } catch (error: any) {
        console.error('Send Phone OTP Error:', error);
        throw new Error(error.message);
    }
};

export const verifyPhoneOTP = async (userId: string, secret: string) => {
    try {
        // Clear existing session if any to avoid "session already active" error
        try { await account.deleteSession('current'); } catch (e) { }
        return await account.createSession(userId, secret);
    } catch (error: any) {
        console.error('Verify Phone OTP Error:', error);
        throw new Error(error.message);
    }
};

export const sendEmailOTP = async (email: string, userId: string = ID.unique()) => {
    try {
        // Appwrite's createEmailToken sends a 6-digit code to the email
        return await account.createEmailToken(userId, email);
    } catch (error: any) {
        console.error('Send Email OTP Error:', error);
        throw new Error(error.message);
    }
};

export const verifyEmailOTP = async (userId: string, secret: string) => {
    try {
        // Clear existing session if any to avoid "session already active" error
        try { await account.deleteSession('current'); } catch (e) { }
        // Verification is exactly the same as phone token: createSession
        return await account.createSession(userId, secret);
    } catch (error: any) {
        console.error('Verify Email OTP Error:', error);
        throw new Error(error.message);
    }
};

export const updateUserProfile = async (documentId: string, data: Partial<UserProfile>) => {
    try {
        return await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.profilesCollectionId,
            documentId,
            data
        );
    } catch (error: any) {
        console.error('Update User Profile Error:', error);
        throw new Error(error.message);
    }
};
export const changePassword = async (newPassword: string, oldPassword: string) => {
    try {
        return await account.updatePassword(newPassword, oldPassword);
    } catch (error: any) {
        console.error('Change Password Error:', error);
        throw new Error(error.message);
    }
};

export const deleteAccount = async (profileId: string) => {
    try {
        // 1. Delete the profile document
        await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.profilesCollectionId,
            profileId
        );

        // Note: Full Appwrite account deletion usually requires server-side logic
        // for security. We delete the profile document and log out.
        await account.deleteSession('current');
        return true;
    } catch (error: any) {
        console.error('Delete Account Error:', error);
        throw new Error(error.message);
    }
};

export const sendPasswordResetEmail = async (email: string) => {
    try {
        // This URL should be your app's deep link or a web handler
        const redirectUrl = 'https://nurse-learning-corner.app/reset-password';
        return await account.createRecovery(email, redirectUrl);
    } catch (error: any) {
        console.error('Send Password Reset Email Error:', error);
        throw new Error(error.message);
    }
};
