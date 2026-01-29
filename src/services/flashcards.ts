import { ID, Query } from 'react-native-appwrite';
import { databases, APPWRITE_CONFIG } from './appwriteClient';

export interface Flashcard {
    $id: string;
    deckId: string;
    front: string;
    back: string;
    nextReview?: string;
    createdAt: string;
    updatedAt: string;
    $createdAt: string;
    $updatedAt: string;
}

export interface FlashcardDeck {
    $id: string;
    userId: string;
    title: string;
    subject?: string;
    contentId?: string; // Optional link to specific study material
    createdAt: string;
    updatedAt: string;
    $createdAt: string;
    $updatedAt: string;
}

export const flashcardService = {
    // --- Deck Operations ---
    async getUserDecks(userId: string): Promise<FlashcardDeck[]> {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.flashcardDecksCollectionId,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('updatedAt')
                ]
            );
            return response.documents as unknown as FlashcardDeck[];
        } catch (error) {
            console.error('Error fetching decks:', error);
            return [];
        }
    },

    async createDeck(userId: string, title: string, subject?: string, contentId?: string): Promise<FlashcardDeck | null> {
        try {
            const now = new Date().toISOString();
            const response = await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.flashcardDecksCollectionId,
                ID.unique(),
                {
                    userId,
                    title,
                    subject,
                    contentId,
                    createdAt: now,
                    updatedAt: now
                }
            );
            return response as unknown as FlashcardDeck;
        } catch (error) {
            console.error('Error creating deck:', error);
            return null;
        }
    },

    // --- Flashcard Operations ---
    async getFlashcards(deckId: string): Promise<Flashcard[]> {
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.flashcardsCollectionId,
                [
                    Query.equal('deckId', deckId),
                    Query.orderAsc('createdAt')
                ]
            );
            return response.documents as unknown as Flashcard[];
        } catch (error) {
            console.error('Error fetching flashcards:', error);
            return [];
        }
    },

    async addFlashcard(deckId: string, front: string, back: string): Promise<Flashcard | null> {
        try {
            const now = new Date().toISOString();
            const response = await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.flashcardsCollectionId,
                ID.unique(),
                {
                    deckId,
                    front,
                    back,
                    createdAt: now,
                    updatedAt: now
                }
            );
            return response as unknown as Flashcard;
        } catch (error) {
            console.error('Error adding flashcard:', error);
            return null;
        }
    },

    async updateFlashcard(cardId: string, data: Partial<Flashcard>): Promise<Flashcard | null> {
        try {
            const now = new Date().toISOString();
            const response = await databases.updateDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.flashcardsCollectionId,
                cardId,
                {
                    ...data,
                    updatedAt: now
                }
            );
            return response as unknown as Flashcard;
        } catch (error) {
            console.error('Error updating flashcard:', error);
            return null;
        }
    },

    async deleteFlashcard(cardId: string): Promise<boolean> {
        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.flashcardsCollectionId,
                cardId
            );
            return true;
        } catch (error) {
            console.error('Error deleting flashcard:', error);
            return false;
        }
    }
};
