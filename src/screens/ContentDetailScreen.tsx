import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getFileUrl } from '../services/content';
import { downloadContent, savePlaybackPosition, getPlaybackPosition, getLocalContentUri } from '../services/downloads';
import { ContentItem } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { addToRecent } from '../services/recent';


const { width, height } = Dimensions.get('window');

const ContentDetailScreen = ({ route, navigation }: any) => {
    const { item }: { item: ContentItem } = route.params;
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [contentUri, setContentUri] = useState<string>(getFileUrl(item.storageFileId));
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [initialPage, setInitialPage] = useState(1);

    // Resolve local URI if available
    useEffect(() => {
        const checkLocal = async () => {
            const local = await getLocalContentUri(item.$id);
            if (local) {
                console.log('Using local content:', local);
                setContentUri(local);
            }
        };
        checkLocal();
    }, [item.$id]);

    const audioPlayer = useAudioPlayer(item.type === 'AUDIO' ? contentUri : null);
    const status = useAudioPlayerStatus(audioPlayer);

    // Resume logic
    useEffect(() => {
        const initPlayer = async () => {
            // Track as recent
            addToRecent(item);

            const savedPosition = await getPlaybackPosition(item.$id);

            // Logic for resumption: 
            // Audio > 2s (2000ms) OR PDF > Page 1
            const shouldPrompt = (item.type === 'AUDIO' && savedPosition > 2000) ||
                (item.type === 'PDF' && savedPosition > 1);

            if (shouldPrompt) {
                Alert.alert(
                    'Resume Study',
                    'Pick up exactly where you left off?',
                    [
                        {
                            text: 'Start Fresh',
                            onPress: () => {
                                setLoading(false);
                                if (item.type === 'PDF') setInitialPage(1);
                            }
                        },
                        {
                            text: 'Resume',
                            onPress: () => {
                                if (item.type === 'AUDIO') {
                                    audioPlayer.seekTo(savedPosition);
                                } else if (item.type === 'PDF') {
                                    setInitialPage(savedPosition);
                                }
                                setLoading(false);
                            }
                        }
                    ],
                    { cancelable: false }
                );
            } else {
                setLoading(false);
            }
        };
        initPlayer();
    }, [item.$id]);

    // Save position periodically
    useEffect(() => {
        if (item.type === 'AUDIO' && status.playing) {
            savePlaybackPosition(item.$id, status.currentTime);
        }
    }, [status.currentTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayAudio = () => {
        if (audioPlayer.playing) {
            audioPlayer.pause();
        } else {
            audioPlayer.play();
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        const success = await downloadContent(
            item.$id,
            item.title,
            item.type,
            item.storageFileId,
            item.subject,
            item.program,
            item.yearOfStudy
        );
        setDownloading(false);
        if (success) {
            Toast.show({
                type: 'success',
                text1: 'Securely Saved',
                text2: 'This resource is now available for offline study.'
            });
        } else {
            Toast.show({
                type: 'error',
                text1: 'Download Error',
                text2: 'Could not save file. Please check your storage.'
            });
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-slate-950">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>

                {/* Modern Ultra-Header */}
                <View className="flex-row items-center px-6 py-4 border-b border-slate-50 dark:border-slate-800">
                    <TouchableOpacity
                        onPress={() => {
                            if (item.type === 'AUDIO') audioPlayer.pause();
                            navigation.goBack();
                        }}
                        className="w-10 h-10 items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl"
                    >
                        <MaterialCommunityIcons name="chevron-left" size={28} color={isDark ? "#FFFFFF" : "#0F172A"} />
                    </TouchableOpacity>

                    <View className="flex-1 items-center px-4">
                        <Text className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter" numberOfLines={1}>{item.title}</Text>
                        <View className="flex-row items-center mt-0.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                            <Text className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.type.replace('_', ' ')}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        className="w-10 h-10 items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-xl"
                        onPress={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <ActivityIndicator size="small" color="#2563EB" />
                        ) : (
                            <MaterialCommunityIcons name="cloud-download-outline" size={22} color="#2563EB" />
                        )}
                    </TouchableOpacity>
                </View>

                {item.type === 'AUDIO' ? (
                    <View className="flex-1 bg-slate-50/50 dark:bg-slate-950 justify-center p-8">
                        <View className="bg-white dark:bg-slate-900 rounded-[40px] p-8 items-center shadow-sm border border-slate-100 dark:border-slate-800/50">

                            <LinearGradient
                                colors={['#2563EB', '#1E40AF']}
                                className="w-56 h-56 rounded-[48px] items-center justify-center mb-10 shadow-2xl shadow-blue-200 dark:shadow-none"
                            >
                                <MaterialCommunityIcons name="headphones" size={100} color="white" />
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.15)', 'transparent']}
                                    className="absolute inset-0 rounded-[48px]"
                                />
                            </LinearGradient>

                            <View className="items-center mb-10">
                                <Text className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2" numberOfLines={2}>{item.title}</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-center font-bold text-xs uppercase tracking-widest px-4">{item.subject || 'Nursing Module'}</Text>
                            </View>

                            {/* Premium Progress Bar */}
                            <View className="w-full mb-10 px-4">
                                <View className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-full mb-3 relative overflow-hidden">
                                    <View
                                        className="h-full bg-blue-600 rounded-full"
                                        style={{ width: `${(status.currentTime / status.duration) * 100 || 0}%` }}
                                    />
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-widest">{formatTime(status.currentTime)}</Text>
                                    <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-widest">{formatTime(status.duration)}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center gap-10">
                                <TouchableOpacity onPress={() => audioPlayer.seekTo(Math.max(0, (status.currentTime || 0) - 15000))} className="opacity-40">
                                    <MaterialCommunityIcons name="rewind-15" size={40} color={isDark ? "#FFFFFF" : "#0F172A"} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="w-24 h-24 rounded-full shadow-xl shadow-blue-100 dark:shadow-none"
                                    onPress={handlePlayAudio}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={['#2563EB', '#1E40AF']}
                                        className="w-full h-full items-center justify-center rounded-full"
                                    >
                                        <MaterialCommunityIcons
                                            name={status.playing ? "pause" : "play"}
                                            size={48}
                                            color="white"
                                            style={!status.playing && { marginLeft: 6 }}
                                        />
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => audioPlayer.seekTo((status.currentTime || 0) + 15000)} className="opacity-40">
                                    <MaterialCommunityIcons name="fast-forward-15" size={40} color={isDark ? "#FFFFFF" : "#0F172A"} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                ) : (
                    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
                        <Pdf
                            source={{ uri: contentUri, cache: true }}
                            page={initialPage}
                            trustAllCerts={false}
                            onLoadComplete={() => setLoading(false)}
                            onPageChanged={(page) => {
                                savePlaybackPosition(item.$id, page);
                            }}
                            onError={(error) => {
                                console.log(error);
                                Toast.show({
                                    type: 'error',
                                    text1: 'Studying Error',
                                    text2: 'Failed to load document.'
                                });
                            }}
                            style={{ flex: 1, width: width, height: height, backgroundColor: isDark ? '#020617' : '#F8FAFC' }}
                            enablePaging={true}
                        />
                        {loading && (
                            <View className="absolute inset-0 bg-white dark:bg-slate-950 items-center justify-center">
                                <ActivityIndicator size="large" color="#2563EB" />
                                <Text className="mt-6 text-slate-400 dark:text-slate-500 font-bold tracking-[3px] text-[10px] uppercase">Decrypting Content</Text>
                            </View>
                        )}
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

export default ContentDetailScreen;
