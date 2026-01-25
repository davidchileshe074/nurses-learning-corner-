import { ID } from 'react-native-appwrite';
import { storage, APPWRITE_CONFIG } from './appwriteClient';

export const uploadFile = async (file: any) => {
    try {
        const fileObj = {
            name: file.name || file.uri.split('/').pop() || 'avatar.jpg',
            type: file.type || 'image/jpeg',
            uri: file.uri,
        };

        // Ensure name has an extension
        if (!fileObj.name.includes('.')) {
            fileObj.name += '.jpg';
        }

        console.log('[DEBUG] Storage: Uploading', fileObj.name, '(', fileObj.type, ')');

        const response = await storage.createFile(
            APPWRITE_CONFIG.storageBucketId,
            ID.unique(),
            fileObj as any
        );

        return response;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const getFileView = (fileId: string) => {
    try {
        return storage.getFileView(APPWRITE_CONFIG.storageBucketId, fileId);
    } catch (error) {
        console.error('Error getting file view:', error);
        throw error;
    }
};

export const deleteFile = async (fileId: string) => {
    try {
        await storage.deleteFile(APPWRITE_CONFIG.storageBucketId, fileId);
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};
