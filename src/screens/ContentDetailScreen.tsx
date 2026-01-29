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
import { useAuth } from '../context/AuthContext';
import { notesService } from '../services/notes';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, Modal, Pressable } from 'react-native';


const { width, height } = Dimensions.get('window');

const ContentDetailScreen = ({ route, navigation }: any) => {
    const { item }: { item: ContentItem } = route.params;
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [contentUri, setContentUri] = useState<string>(getFileUrl(item.storageFileId));
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [initialPage, setInitialPage] = useState(1);
    const { user } = useAuth();
    const [noteText, setNoteText] = useState('');
    const [isNotesVisible, setIsNotesVisible] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);

    // Resume Modal State
    const [isResumeModalVisible, setIsResumeModalVisible] = useState(false);
    const [savedPos, setSavedPos] = useState(0);
    const [readyToRender, setReadyToRender] = useState(false);

    // Resolve local URI if available and check download status
    useEffect(() => {
        const checkLocal = async () => {
            const local = await getLocalContentUri(item.$id);
            if (local) {
                console.log('Using local content:', local);
                setContentUri(local);
                setIsDownloaded(true);
            } else {
                setIsDownloaded(false);
            }
        };
        checkLocal();
    }, [item.$id, downloading]);

    const audioPlayer = useAudioPlayer((item.type === 'AUDIO' && readyToRender) ? contentUri : null);
    const status = useAudioPlayerStatus(audioPlayer);

    // Resume logic
    useEffect(() => {
        const initPlayer = async () => {
            // Track as recent
            addToRecent(item);

            const savedPosition = await getPlaybackPosition(item.$id);
            setSavedPos(savedPosition);

            // Logic for resumption: 
            // Audio > 0s OR PDF >= 1 (if they've opened it before)
            // We use savedPosition > 0 to ensure even minor progress triggers the prompt
            const shouldPrompt = (item.type === 'AUDIO' && savedPosition > 0) ||
                (item.type === 'PDF' && savedPosition >= 1);

            if (shouldPrompt) {
                // Show custom expert-level modal instead of Native Alert
                setIsResumeModalVisible(true);
            } else {
                setLoading(false);
                setReadyToRender(true);
            }
        };
        initPlayer();
    }, [item.$id]);

    const handleResume = (shouldResume: boolean) => {
        if (shouldResume) {
            if (item.type === 'AUDIO') {
                audioPlayer.seekTo(savedPos);
            } else if (item.type === 'PDF') {
                setInitialPage(savedPos);
            }
        } else {
            if (item.type === 'PDF') setInitialPage(1);
        }
        setIsResumeModalVisible(false);
        setReadyToRender(true);
        setLoading(false);
    };

    // Fetch Note logic
    useEffect(() => {
        const fetchNote = async () => {
            if (user) {
                const note = await notesService.getNote(item.$id, user.userId);
                if (note) setNoteText(note.text);

                // If we came from the Notebook with autoOpenNotes, show the modal
                if (route.params?.autoOpenNotes) {
                    setIsNotesVisible(true);
                }
            }
        };
        fetchNote();
    }, [item.$id, user, route.params?.autoOpenNotes]);

    const handleSaveNote = async () => {
        if (!user) return;
        setSavingNote(true);
        const success = await notesService.saveNote(item.$id, user.userId, noteText);
        setSavingNote(false);
        if (success) {
            Toast.show({
                type: 'success',
                text1: 'Note Saved',
                text2: 'Your study reflections are synced!'
            });
            // Auto close modal after successful save
            setTimeout(() => {
                setIsNotesVisible(false);
            }, 500);
        }
    };

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
                <View className="flex-row items-center px-6 py-4 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <TouchableOpacity
                        onPress={() => {
                            if (item.type === 'AUDIO') audioPlayer.pause();
                            navigation.goBack();
                        }}
                        className="w-10 h-10 items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl"
                    >
                        <MaterialCommunityIcons name="chevron-left" size={28} color={isDark ? "#FFFFFF" : "#0F172A"} />
                    </TouchableOpacity>

                    <View className="flex-1 items-center justify-center px-4">
                        <Text className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight text-center" numberOfLines={1}>{item.title}</Text>
                        <View className="flex-row items-center mt-1">
                            <View className="w-1 h-1 rounded-full bg-blue-500 mr-2" />
                            <Text className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">{item.type.replace('_', ' ')}</Text>
                        </View>
                    </View>

                    {!isDownloaded && (
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
                    )}
                    {isDownloaded && (
                        <View className="w-10 h-10 items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <MaterialCommunityIcons name="check-decagram-outline" size={22} color="#22C55E" />
                        </View>
                    )}
                </View>

                {/* Defer rendering until selection is made and check is complete */}
                {(!readyToRender || isResumeModalVisible) ? (
                    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text className="mt-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Ensuring Session Security...</Text>
                    </View>
                ) : (
                    item.type === 'AUDIO' ? (
                        <ScrollView
                            className="flex-1 bg-slate-50/50 dark:bg-slate-950"
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="bg-white dark:bg-slate-900 rounded-[40px] p-8 items-center shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/50">

                                <LinearGradient
                                    colors={['#2563EB', '#1E40AF']}
                                    className="w-48 h-48 rounded-[40px] items-center justify-center mb-8 shadow-2xl shadow-blue-500/30 dark:shadow-none"
                                >
                                    <MaterialCommunityIcons name="headphones" size={80} color="white" />
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.2)', 'transparent']}
                                        className="absolute inset-0 rounded-[40px]"
                                    />
                                </LinearGradient>

                                <View className="items-center mb-8 px-2">
                                    <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-2 leading-tight" numberOfLines={3}>{item.title}</Text>
                                    <View className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                                        <Text className="text-blue-600 dark:text-blue-400 text-center font-black text-[9px] uppercase tracking-[2px]">{item.subject || 'Nursing Module'}</Text>
                                    </View>
                                </View>

                                {/* Premium Progress Bar */}
                                <View className="w-full mb-8 px-2">
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

                                <View className="flex-row items-center justify-center gap-8">
                                    <TouchableOpacity onPress={() => audioPlayer.seekTo(Math.max(0, (status.currentTime || 0) - 15000))} className="opacity-60 bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-full items-center justify-center">
                                        <MaterialCommunityIcons name="rewind-15" size={24} color={isDark ? "#FFFFFF" : "#0F172A"} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className="w-20 h-20 rounded-full shadow-2xl shadow-blue-500/40 dark:shadow-none"
                                        onPress={handlePlayAudio}
                                        disabled={loading}
                                    >
                                        <LinearGradient
                                            colors={['#2563EB', '#3B82F6']}
                                            className="w-full h-full items-center justify-center rounded-full"
                                        >
                                            <MaterialCommunityIcons
                                                name={status.playing ? "pause" : "play"}
                                                size={40}
                                                color="white"
                                                style={!status.playing && { marginLeft: 4 }}
                                            />
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => audioPlayer.seekTo((status.currentTime || 0) + 15000)} className="opacity-60 bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-full items-center justify-center">
                                        <MaterialCommunityIcons name="fast-forward-15" size={24} color={isDark ? "#FFFFFF" : "#0F172A"} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>

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
                    )
                )}

                {/* Floating Note Button */}
                <TouchableOpacity
                    onPress={() => setIsNotesVisible(true)}
                    activeOpacity={0.8}
                    className="absolute bottom-8 right-6 w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center shadow-2xl shadow-blue-500/40 z-50 border-2 border-white/10"
                >
                    <MaterialCommunityIcons name="notebook-edit-outline" size={30} color="white" />
                    {noteText.length > 0 && (
                        <View className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white items-center justify-center">
                            <MaterialCommunityIcons name="check" size={10} color="white" />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Notes Modal / Bottom Sheet */}
                <Modal
                    visible={isNotesVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsNotesVisible(false)}
                    statusBarTranslucent
                >
                    <View className="flex-1">
                        <Pressable
                            className="absolute inset-0 bg-black/60"
                            onPress={() => setIsNotesVisible(false)}
                        />
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                            className="flex-1 justify-end"
                            keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
                        >
                            <View className="bg-white dark:bg-slate-900 rounded-t-[48px] shadow-2xl overflow-hidden max-h-[85%] border-t border-white/20">
                                {/* Elegant Drag Handle */}
                                <View className="items-center pt-3 pb-1">
                                    <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full opacity-50" />
                                </View>

                                <ScrollView
                                    bounces={false}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 20, paddingBottom: 160 }}
                                >
                                    <View className="flex-row justify-between items-start mb-8">
                                        <View className="flex-1 mr-4">
                                            <View className="flex-row items-center mb-1">
                                                <MaterialCommunityIcons name="pencil-box-multiple-outline" size={16} color="#2563EB" />
                                                <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[3px] ml-2">Digital Study Pad</Text>
                                            </View>
                                            <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">Study Notes</Text>
                                            <Text className="text-slate-400 dark:text-slate-500 font-medium text-xs leading-5" numberOfLines={2}>Reflections on {item.title}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setIsNotesVisible(false)}
                                            activeOpacity={0.7}
                                            className="w-11 h-11 bg-slate-50 dark:bg-slate-800/80 rounded-2xl items-center justify-center border border-slate-100 dark:border-slate-800"
                                        >
                                            <MaterialCommunityIcons name="close" size={22} color={isDark ? "#FFFFFF" : "#0F172A"} />
                                        </TouchableOpacity>
                                    </View>

                                    <View className="bg-slate-50/50 dark:bg-slate-800/40 rounded-[32px] p-6 mb-10 border border-slate-100/50 dark:border-white/5 shadow-inner">
                                        <TextInput
                                            className="text-slate-800 dark:text-slate-100 text-[17px] font-medium min-h-[180px] leading-7"
                                            placeholder="Capture your thoughts, mnemonic, or study focus here..."
                                            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                            multiline
                                            textAlignVertical="top"
                                            value={noteText}
                                            onChangeText={setNoteText}
                                            selectionColor="#2563EB"
                                            autoFocus={false}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleSaveNote}
                                        disabled={savingNote}
                                        activeOpacity={0.9}
                                        className="shadow-xl shadow-blue-500/30"
                                    >
                                        <LinearGradient
                                            colors={savingNote ? ['#94A3B8', '#64748B'] : ['#2563EB', '#1D4ED8']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            className="w-full py-5 rounded-[24px] items-center justify-center flex-row"
                                        >
                                            {savingNote ? (
                                                <ActivityIndicator size="small" color="white" className="mr-3" />
                                            ) : (
                                                <MaterialCommunityIcons name="cloud-sync-outline" size={24} color="white" />
                                            )}
                                            <Text className="text-white font-black text-base uppercase tracking-[2px] ml-3">
                                                {savingNote ? 'Saving...' : 'Save Study Notes'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <View className="mt-8 items-center">
                                        <Text className="text-slate-400 dark:text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                                            Cloud Synced • Private to you
                                        </Text>
                                    </View>
                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

                {/* Premium Resume Study Modal */}
                <Modal
                    visible={isResumeModalVisible}
                    transparent={true}
                    animationType="fade"
                >
                    <View className="flex-1 bg-black/70 justify-center px-8">
                        <View className="bg-white dark:bg-slate-900 w-full rounded-[48px] p-8 shadow-2xl border border-white/10 overflow-hidden">
                            <View className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-[30px] items-center justify-center mb-8 self-center">
                                <MaterialCommunityIcons name="history" size={40} color="#2563EB" />
                            </View>

                            <Text className="text-3xl font-black text-slate-900 dark:text-white text-center mb-3 tracking-tighter">Resume Study?</Text>
                            <Text className="text-slate-400 dark:text-slate-500 text-center font-bold text-[10px] uppercase tracking-[3px] mb-12">
                                {item.type === 'AUDIO' ? `Last heard at ${Math.floor(savedPos / 60000)}m ${Math.floor((savedPos % 60000) / 1000)}s` : `Last read up to Page ${savedPos}`}
                            </Text>

                            <TouchableOpacity
                                onPress={() => handleResume(true)}
                                activeOpacity={0.9}
                                className="mb-4 shadow-xl shadow-blue-500/30"
                            >
                                <LinearGradient
                                    colors={['#2563EB', '#1D4ED8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="w-full py-5 rounded-[24px] items-center justify-center flex-row"
                                >
                                    <MaterialCommunityIcons name="play-circle" size={22} color="white" />
                                    <Text className="text-white font-black text-base uppercase tracking-[2px] ml-3">Continue Learning</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleResume(false)}
                                activeOpacity={0.7}
                                className="w-full py-5 rounded-[24px] items-center justify-center bg-slate-50 dark:bg-slate-800/50"
                            >
                                <Text className="text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest">Start Fresh</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </SafeAreaView >
        </View >
    );
};

export default ContentDetailScreen;
