import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { databases, APPWRITE_CONFIG } from './appwriteClient';

const DEVICE_ID_KEY = 'nurse_learning_corner_device_id';

export const getDeviceId = async (): Promise<string> => {
  // Prefer a stable OS-provided ID on Android (can change after factory reset)
  let deviceId = '';

  if (Platform.OS === 'android') {
    deviceId = Application.getAndroidId() ?? '';
  }

  // If no OS id (iOS/unknown), use SecureStore-cached UUID
  if (!deviceId) {
    const storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (storedId) return storedId;

    const newId = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    return newId;
  }

  return deviceId;
};

export const bindDeviceToProfile = async (profileId: string, deviceId: string) => {
  try {
    await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.profilesCollectionId,
      profileId,
      { deviceId }
    );
  } catch (error: any) {
    console.error('Bind Device Error:', error);
    throw new Error(error?.message ?? 'Failed to bind device');
  }
};

export const resetDeviceBinding = async (userId: string) => {
  console.log('Resetting device binding for user:', userId);
};
