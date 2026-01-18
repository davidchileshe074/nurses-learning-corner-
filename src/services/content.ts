import { Query } from 'react-native-appwrite';
import { databases, APPWRITE_CONFIG } from './appwriteClient';
import { ContentItem, Program, YearOfStudy } from '../types';

export const getContent = async (program: Program, yearOfStudy: any): Promise<ContentItem[]> => {
    try {
        if (!program || !yearOfStudy) return [];

        // Ensure yearOfStudy is a valid number
        let yearNum = parseInt(yearOfStudy);

        // Handle cases where yearOfStudy might be a string like "Year 1"
        if (isNaN(yearNum) && typeof yearOfStudy === 'string') {
            const match = yearOfStudy.match(/\d+/);
            if (match) yearNum = parseInt(match[0]);
        }

        if (isNaN(yearNum)) {
            console.error('Invalid yearOfStudy format:', yearOfStudy);
            return [];
        }

        const result = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.contentCollectionId,
            [
                Query.equal('program', program),
                Query.equal('yearOfStudy', yearNum.toString()) // Appwrite expects a string if the attribute is defined as a string
            ]
        );


        return result.documents as unknown as ContentItem[];
    } catch (error: any) {
        if (error.code === 401 || error.code === 403) {
            console.warn('Content access restricted. Check collection permissions.');
        } else {
            console.error('Get content error:', error);
        }
        return [];
    }
};


export const getFileUrl = (fileId: string): string => {
    // Replace with your Appwrite project endpoint and bucket ID
    return `https://fra.cloud.appwrite.io/v1/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${fileId}/view?project=691d352300367a9ca3ac`;
};
