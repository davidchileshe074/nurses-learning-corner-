import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    StatusBar,
    ActivityIndicator,
    Dimensions,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLocalDownloads } from '../services/downloads';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionStatus, checkSubscriptionExpiry } from '../services/subscription';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DownloadsScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [downloads, setDownloads] = useState<any[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const initDownloads = useCallback(async () => {
        try {
            if (user) {
                const sub = await getSubscriptionStatus(user.userId);
                setIsSubscribed(checkSubscriptionExpiry(sub));
            }
            const local = await getLocalDownloads();
            setDownloads(local);
        } catch (error) {
            console.error('[Downloads] Init Error:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        initDownloads();
        const unsubscribe = navigation.addListener('focus', initDownloads);
        return unsubscribe;
    }, [navigation, initDownloads]);

    const handleOpen = (item: any) => {
        if (!isSubscribed) {
            Alert.alert(
                'Access Restricted',
                'Your subscription has expired. Please renew to access your downloaded materials.',
                [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Go to Account', onPress: () => navigation.navigate('Account') }
                ]
            );
            return;
        }
        navigation.navigate('ContentDetail', {
            item: {
                ...item,
                storageFileId: item.localUri.split('/').pop(),
                $id: item.id // Ensure ID matching
            }
        });
    };

    const renderItem = ({ item }: { item: any }) => {
        let icon: any = "file-document-outline";
        let color = "#2563EB"; // Blue

        if (item.type === 'AUDIO') {
            icon = "headphones";
            color = isDark ? "#818CF8" : "#4F46E5"; // indigo
        } else if (item.type === 'MARKING_KEY') {
            icon = "check-decagram-outline";
            color = isDark ? "#38BDF8" : "#0284C7"; // sky
        } else if (item.type === 'PAST_PAPER') {
            icon = "file-question-outline";
            color = isDark ? "#22D3EE" : "#0891B2"; // cyan
        }

        return (
            <TouchableOpacity
                className="bg-white dark:bg-slate-900 p-5 rounded-[32px] mb-4 flex-row items-center shadow-sm border border-slate-100 dark:border-slate-800"
                onPress={() => handleOpen(item)}
                activeOpacity={0.7}
            >
                <View
                    className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: isDark ? `${color}20` : `${color}10` }}
                >
                    <MaterialCommunityIcons name={icon} size={30} color={color} />
                </View>

                <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-black text-base mb-1" numberOfLines={1}>{item.title}</Text>
                    <View className="flex-row items-center">
                        <View className="bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md mr-2 border border-slate-100 dark:border-slate-700 flex-row items-center">
                            <MaterialCommunityIcons name="clock-outline" size={10} color={isDark ? "#94A3B8" : "#94A3B8"} />
                            <Text className="text-[9px] text-slate-400 dark:text-slate-500 ml-1 font-black uppercase">
                                Saved: {new Date(item.expiryDate).toLocaleDateString()}
                            </Text>
                        </View>
                        <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: isDark ? `${color}30` : `${color}15` }}>
                            <Text className="text-[9px] font-black uppercase tracking-widest" style={{ color: color }}>
                                {item.type}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="ml-2 opacity-20">
                    <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? "#FFFFFF" : "#0F172A"} />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white dark:bg-slate-950">
                <ActivityIndicator size="large" color={isDark ? "#60A5FA" : "#2563EB"} />
                <Text className="mt-4 text-slate-400 dark:text-slate-500 font-bold tracking-[3px] text-[10px] uppercase">Accessing Vault</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <View className="bg-white dark:bg-slate-900 px-6 pb-8 border-b border-slate-100 dark:border-slate-800 shadow-sm">
                <SafeAreaView edges={['top']}>
                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[3px] mb-1">Offline Access</Text>
                    <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">My Downloads</Text>

                    <View className="flex-row items-center mt-4 bg-sky-50 dark:bg-sky-900/20 self-start px-3 py-1.5 rounded-xl border border-sky-100 dark:border-sky-800/50">
                        <View className="w-2 h-2 rounded-full bg-sky-500 mr-2" />
                        <Text className="text-[10px] font-black text-sky-700 dark:text-sky-400 uppercase tracking-widest">
                            {downloads.length} Materials Encrypted Locally
                        </Text>
                    </View>
                </SafeAreaView>
            </View>

            <FlatList
                data={downloads}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View className="items-center mt-20 px-10">
                        <View className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[40px] items-center justify-center mb-8 shadow-sm border border-slate-100 dark:border-slate-800">
                            <MaterialCommunityIcons name="cloud-download-outline" size={50} color={isDark ? "#475569" : "#CBD5E1"} />
                        </View>
                        <Text className="text-2xl font-black text-slate-900 dark:text-white text-center mb-3">Vault is Empty</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-center font-medium leading-6 mb-10">
                            Materials you download for offline study will be securely stored here.
                        </Text>

                        <TouchableOpacity
                            className="bg-blue-600 px-10 py-4 rounded-[24px] shadow-xl shadow-blue-200 dark:shadow-none"
                            onPress={() => navigation.navigate('Library')}
                        >
                            <Text className="text-white font-black uppercase tracking-[2px] text-xs">Browse Library</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
};

export default DownloadsScreen;
