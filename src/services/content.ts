import { Query } from 'react-native-appwrite';
import { databases, APPWRITE_CONFIG } from './appwriteClient';
import { ContentItem, Program, YearOfStudy, Subject } from '../types';
import * as FileSystem from 'expo-file-system/legacy';

const CONTENT_CACHE_FILE = `${FileSystem.cacheDirectory}content_metadata_cache.json`;

const saveToCache = async (content: ContentItem[]) => {
    try {
        await FileSystem.writeAsStringAsync(CONTENT_CACHE_FILE, JSON.stringify(content));
    } catch (e) {
        console.warn('[Cache] Save Error:', e);
    }
};

const getFromCache = async (): Promise<ContentItem[]> => {
    try {
        const info = await FileSystem.getInfoAsync(CONTENT_CACHE_FILE);
        if (info.exists) {
            const content = await FileSystem.readAsStringAsync(CONTENT_CACHE_FILE);
            return JSON.parse(content);
        }
    } catch (e) {
        console.warn('[Cache] Read Error:', e);
    }
    return [];
};

export const getContent = async (
    program?: Program,
    yearOfStudy?: any,
    subject?: Subject,
    type?: string,
    offset: number = 0,
    limit: number = 10
): Promise<{ documents: ContentItem[], total: number }> => {
    try {
        const queries = [
            Query.limit(limit),
            Query.offset(offset),
            Query.orderDesc('$createdAt')
        ];

        if (program) {
            const programsToQuery: string[] = [program];
            if (program === 'REGISTERED-NURSING') {
                programsToQuery.push('G-NURSING');
                programsToQuery.push('RN');
            }
            queries.push(Query.equal('program', programsToQuery));
        }

        if (yearOfStudy) {
            const yearDigit = String(yearOfStudy).replace(/\D/g, '');
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

        const documents = result.documents as unknown as ContentItem[];

        // Only cache the first page to keep offline access for most recent items
        if (offset === 0 && documents.length > 0) {
            saveToCache(documents);
        }

        return {
            documents,
            total: result.total
        };
    } catch (error: any) {
        console.error('Get content error (attempting cache):', error.message);

        // Fallback to cache if offline (only for first page)
        if (offset === 0) {
            const cached = await getFromCache();
            if (cached.length > 0) {
                const filtered = cached.filter(item => {
                    if (program && item.program !== program) return false;
                    if (subject && item.subject !== subject) return false;
                    return true;
                });
                return { documents: filtered, total: filtered.length };
            }
        }

        return { documents: [], total: 0 };
    }
};


export const getFileUrl = (fileId: string): string => {
    // Replace with your Appwrite project endpoint and bucket ID
    return `https://fra.cloud.appwrite.io/v1/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${fileId}/view?project=${APPWRITE_CONFIG.projectId}`;
};
