import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { getFileUrl } from './content';

const METADATA_KEY = 'downloads_metadata';

const getBaseDir = () => {
    return (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
};

const getDownloadsDir = () => {
    const base = getBaseDir();
    return base ? `${base}downloads/` : '';
};


interface DownloadMetadata {
    id: string;
    title: string;
    type: string;
    expiryDate: string;
    localUri: string;
}

export const initDownloads = async () => {
    const downloadsDir = getDownloadsDir();
    if (!downloadsDir) return;

    const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
    }
};

export const downloadContent = async (
    id: string,
    title: string,
    type: string,
    fileId: string
) => {
    const downloadsDir = getDownloadsDir();
    if (!downloadsDir) {
        console.warn('Downloads not supported on this platform');
        return false;
    }

    await initDownloads();

    const localUri = `${downloadsDir}${fileId}`;
    const remoteUrl = getFileUrl(fileId);

    const downloadResumable = FileSystem.createDownloadResumable(remoteUrl, localUri, {});

    try {
        const result = await downloadResumable.downloadAsync();
        if (!result) return false;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        const metadata = await getDownloadsMetadata();
        metadata[id] = {
            id,
            title,
            type,
            expiryDate: expiryDate.toISOString(),
            localUri: result.uri,
        };

        await saveDownloadsMetadata(metadata);
        return true;
    } catch (error) {
        console.error('Download error:', error);
        return false;
    }
};

export const getDownloadsMetadata = async (): Promise<Record<string, DownloadMetadata>> => {
    const stored = await SecureStore.getItemAsync(METADATA_KEY);
    return stored ? JSON.parse(stored) : {};
};

const saveDownloadsMetadata = async (metadata: Record<string, DownloadMetadata>) => {
    await SecureStore.setItemAsync(METADATA_KEY, JSON.stringify(metadata));
};

export const getLocalDownloads = async () => {
    const metadata = await getDownloadsMetadata();
    const now = new Date();

    const validDownloads: DownloadMetadata[] = [];

    for (const id in metadata) {
        const item = metadata[id];

        if (new Date(item.expiryDate) > now) {
            validDownloads.push(item);
            continue;
        }

        // Clean up expired file
        try {
            await FileSystem.deleteAsync(item.localUri, { idempotent: true });
            delete metadata[id];
        } catch (e) {
            console.error('Cleanup error:', e);
        }
    }

    await saveDownloadsMetadata(metadata);
    return validDownloads;
};
