import { Client, Account, Databases, Storage, Functions } from 'react-native-appwrite';
import { Platform } from 'react-native';

export const APPWRITE_CONFIG = {
    projectId: '691d352300367a9ca3ac',
    databaseId: 'nmlc', // Replace with your database ID
    profilesCollectionId: 'profiles',
    subscriptionsCollectionId: 'subscriptions',
    contentCollectionId: 'content',
    accessCodesCollectionId: 'accessCodes',
    storageBucketId: '696768cb0021abe33b61',
};

const client = new Client();

client
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject(APPWRITE_CONFIG.projectId)
    .setPlatform('com.chileshe12345678.nurselearningcorner');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export default client;
