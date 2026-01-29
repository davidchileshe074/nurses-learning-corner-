import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getFileUrl } from './content';

const METADATA_FILENAME = 'downloads_manifest.json';

const getBaseDir = () => {
    // On web, documentDirectory is null. On mobile, it's always set.
    return FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
};

const getDownloadsDir = () => {
    const base = getBaseDir();
    return base ? `${base}downloads/` : '';
};

const getMetadataFilePath = () => {
    const base = getBaseDir();
    return base ? `${base}${METADATA_FILENAME}` : '';
};

interface DownloadMetadata {
    id: string;
    title: string;
    type: string;
    subject?: string;
    program?: string;
    yearOfStudy?: string;
    expiryDate: string;
    localUri: string;
    lastPosition?: number;
}

/**
 * Initializes the download directory and metadata file
 */
export const initDownloads = async () => {
    const downloadsDir = getDownloadsDir();
    const metadataPath = getMetadataFilePath();

    if (!downloadsDir) return;

    try {
        const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
        }

        const metaInfo = await FileSystem.getInfoAsync(metadataPath);
        if (!metaInfo.exists) {
            await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify({}));
        }
    } catch (e) {
        console.error('[Downloads] Init Error:', e);
    }
};

/**
 * Saves metadata to a dedicated JSON file instead of SecureStore 
 * (SecureStore has a 2048-byte limit which easily breaks with multiple downloads)
 */
const saveDownloadsMetadata = async (metadata: Record<string, DownloadMetadata>) => {
    const path = getMetadataFilePath();
    if (!path) return;
    try {
        await FileSystem.writeAsStringAsync(path, JSON.stringify(metadata));
    } catch (e) {
        console.error('[Downloads] Save Meta Error:', e);
    }
};

/**
 * Reads metadata from the local JSON file
 */
export const getDownloadsMetadata = async (): Promise<Record<string, DownloadMetadata>> => {
    const path = getMetadataFilePath();
    if (!path) return {};
    try {
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) return {};

        const content = await FileSystem.readAsStringAsync(path);
        return content ? JSON.parse(content) : {};
    } catch (e) {
        console.error('[Downloads] Get Meta Error:', e);
        return {};
    }
};

export const downloadContent = async (
    id: string,
    title: string,
    type: string,
    fileId: string,
    subject?: string,
    program?: string,
    yearOfStudy?: string
) => {
    const downloadsDir = getDownloadsDir();
    if (!downloadsDir) {
        console.warn('[Downloads] Platform not supported for persistent storage');
        return false;
    }

    await initDownloads();

    // Use a clean filename (fileId or sanitized title)
    const localUri = `${downloadsDir}${fileId}`;
    const remoteUrl = getFileUrl(fileId);

    const downloadResumable = FileSystem.createDownloadResumable(
        remoteUrl,
        localUri,
        {},
        (progress) => {
            // Can be used for progress bars in UI if needed
            // console.log(`Progress: ${progress.totalBytesWritten / progress.totalBytesExpectedToWrite}`);
        }
    );

    try {
        const result = await downloadResumable.downloadAsync();
        if (!result) return false;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 90); // 90 day expiry for offline access

        const metadata = await getDownloadsMetadata();
        metadata[id] = {
            id,
            title,
            type,
            subject,
            program,
            yearOfStudy,
            expiryDate: expiryDate.toISOString(),
            localUri: result.uri,
        };

        await saveDownloadsMetadata(metadata);
        return true;
    } catch (error) {
        console.error('[Downloads] Download process failed:', error);
        return false;
    }
};

export const getLocalDownloads = async () => {
    const metadata = await getDownloadsMetadata();
    const now = new Date();
    const validDownloads: DownloadMetadata[] = [];
    let stateChanged = false;

    for (const id in metadata) {
        const item = metadata[id];

        // Check file existence and expiry
        const fileInfo = await FileSystem.getInfoAsync(item.localUri);

        if (fileInfo.exists && new Date(item.expiryDate) > now) {
            validDownloads.push(item);
        } else {
            // Clean up missing or expired references
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(item.localUri, { idempotent: true });
            }
            delete metadata[id];
            stateChanged = true;
        }
    }

    if (stateChanged) {
        await saveDownloadsMetadata(metadata);
    }

    return validDownloads;
};

export const savePlaybackPosition = async (id: string, position: number) => {
    try {
        const metadata = await getDownloadsMetadata();
        if (metadata[id]) {
            metadata[id].lastPosition = position;
            await saveDownloadsMetadata(metadata);
        } else {
            // Save non-downloaded progress to a separate metadata file or SecureStore
            // For now, let's keep it simple and just use SecureStore for small progress pointers
            await SecureStore.setItemAsync(`pos_${id}`, position.toString());
        }
    } catch (e) {
        console.error('Error saving progress:', e);
    }
};

export const getPlaybackPosition = async (id: string): Promise<number> => {
    try {
        const metadata = await getDownloadsMetadata();
        if (metadata[id]?.lastPosition) {
            return metadata[id].lastPosition;
        }

        const stored = await SecureStore.getItemAsync(`pos_${id}`);
        return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
        return 0;
    }
};

export const getLocalContentUri = async (id: string): Promise<string | null> => {
    try {
        const metadata = await getDownloadsMetadata();
        const item = metadata[id];
        if (item) {
            const now = new Date();
            if (new Date(item.expiryDate) > now) {
                const info = await FileSystem.getInfoAsync(item.localUri);
                if (info.exists) {
                    return item.localUri;
                }
            }
        }
        return null;
    } catch (e) {
        return null;
    }
};
export const removeAllDownloads = async () => {
    try {
        const metadata = await getDownloadsMetadata();
        for (const id in metadata) {
            const item = metadata[id];
            await FileSystem.deleteAsync(item.localUri, { idempotent: true });
        }
        const path = getMetadataFilePath();
        if (path) {
            await FileSystem.writeAsStringAsync(path, JSON.stringify({}));
        }
        return true;
    } catch (e) {
        console.error('[Downloads] Remove All Error:', e);
        return false;
    }
};
