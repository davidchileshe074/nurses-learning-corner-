import * as FileSystem from 'expo-file-system/legacy';
import { ContentItem } from '../types';

const RECENT_FILE = `${FileSystem.documentDirectory}recent_study.json`;
const MAX_RECENT = 10;

export const addToRecent = async (item: ContentItem) => {
    try {
        const current = await getRecentItems();
        // Remove if already exists (to move to front)
        const filtered = current.filter(i => i.$id !== item.$id);
        const updated = [item, ...filtered].slice(0, MAX_RECENT);

        await FileSystem.writeAsStringAsync(RECENT_FILE, JSON.stringify(updated));
    } catch (e) {
        console.error('[Recent] Add Error:', e);
    }
};

export const getRecentItems = async (): Promise<ContentItem[]> => {
    try {
        const info = await FileSystem.getInfoAsync(RECENT_FILE);
        if (!info.exists) return [];

        const content = await FileSystem.readAsStringAsync(RECENT_FILE);
        return JSON.parse(content);
    } catch (e) {
        return [];
    }
};
