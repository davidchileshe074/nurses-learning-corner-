import { Query } from 'react-native-appwrite';
import { databases, APPWRITE_CONFIG } from './appwriteClient';
import { ContentItem, Program, YearOfStudy, Subject } from '../types';

export const getContent = async (program?: Program, yearOfStudy?: any, subject?: Subject, type?: string): Promise<ContentItem[]> => {
    try {
        const queries = [];

        if (program) {
            const programsToQuery: string[] = [program];
            if (program === 'REGISTERED-NURSING') {
                programsToQuery.push('G-NURSING');
                programsToQuery.push('RN');
            }
            queries.push(Query.equal('program', programsToQuery));
        }

        if (yearOfStudy) {
            const yearDigit = yearOfStudy.replace(/\D/g, '');
            queries.push(Query.equal('yearOfStudy', [yearOfStudy, yearDigit, `year${yearDigit}`]));
        }

        if (subject) {
            queries.push(Query.equal('subject', subject));
        }

        if (type && type !== 'All') {
            const filterType = type.toUpperCase().trim().replace(/\s+/g, '_');
            queries.push(Query.equal('type', filterType));
        }

        const result = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.contentCollectionId,
            queries
        );

        return result.documents as unknown as ContentItem[];
    } catch (error: any) {
        if (error.code === 401 || error.code === 403) {
            console.warn(`[AUTH ERROR] Content access restricted for collection '${APPWRITE_CONFIG.contentCollectionId}'. Code: ${error.code}`);
            console.warn('Check if "Users" have "Read" permissions in Appwrite Console.');
        } else {
            console.error('Get content error:', error);
        }
        return [];
    }
};


export const getFileUrl = (fileId: string): string => {
    // Replace with your Appwrite project endpoint and bucket ID
    return `https://fra.cloud.appwrite.io/v1/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${fileId}/view?project=${APPWRITE_CONFIG.projectId}`;
};
