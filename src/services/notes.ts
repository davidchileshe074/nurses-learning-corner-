import { ID, Query } from 'react-native-appwrite';
import { databases, APPWRITE_CONFIG } from './appwriteClient';
import { ContentItem } from '../types';

export interface Note {
    $id: string;
    noteId: string;
    userId: string;
    contentId: string;
    text: string;
    tags?: string;
    createdAt: string;
    updatedAt: string;
    $createdAt: string;
    $updatedAt: string;
    contentTitle?: string;
    contentSubject?: string;
    contentItem?: ContentItem;
}

export const notesService = {
    async getNote(contentId: string, userId: string): Promise<Note | null> {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.notesCollectionId,
                [
                    Query.equal('contentId', contentId),
                    Query.equal('userId', userId)
                ]
            );

            if (response.documents.length > 0) {
                return response.documents[0] as unknown as Note;
            }
            return null;
        } catch (error) {
            console.error('Error fetching note:', error);
            return null;
        }
    },

    async saveNote(contentId: string, userId: string, text: string): Promise<Note | null> {
        try {
            const now = new Date().toISOString();
            // Check if note already exists
            const existingNote = await this.getNote(contentId, userId);

            if (existingNote) {
                // Update existing note
                const response = await databases.updateDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.notesCollectionId,
                    existingNote.$id,
                    {
                        text,
                        updatedAt: now
                    }
                );
                return response as unknown as Note;
            } else {
                // Create new note
                const noteId = ID.unique();
                const response = await databases.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.notesCollectionId,
                    noteId,
                    {
                        noteId,
                        userId,
                        contentId,
                        text,
                        createdAt: now,
                        updatedAt: now
                    }
                );
                return response as unknown as Note;
            }
        } catch (error) {
            console.error('Error saving note:', error);
            return null;
        }
    },

    async getUserNotes(userId: string): Promise<Note[]> {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.notesCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('updatedAt')
                ]
            );

            const notes = response.documents as unknown as Note[];

            // Fetch content metadata for each note to show titles
            const notesWithContent = await Promise.all(notes.map(async (note) => {
                try {
                    const content = await databases.getDocument(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.contentCollectionId,
                        note.contentId
                    );
                    return {
                        ...note,
                        contentTitle: content.title,
                        contentSubject: content.subject,
                        contentItem: content as unknown as ContentItem
                    };
                } catch {
                    return { ...note, contentTitle: 'Unknown Content' };
                }
            }));

            return notesWithContent;
        } catch (error) {
            console.error('Error fetching user notes:', error);
            return [];
        }
    },

    async deleteNote(noteId: string): Promise<boolean> {
        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.notesCollectionId,
                noteId
            );
            return true;
        } catch (error) {
            console.error('Error deleting note:', error);
            return false;
        }
    }
};
