import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    useColorScheme,
    RefreshControl,
    Alert,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { notesService, Note } from '../services/notes';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const NotebookScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const isDark = useColorScheme() === 'dark';
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotes = async () => {
        if (!user) return;
        const data = await notesService.getUserNotes(user.userId);
        setNotes(data);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchNotes();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotes();
    };

    const handleDeleteNote = async (noteId: string) => {
        Alert.alert(
            "Delete Note",
            "Are you sure you want to remove this study reflection?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const success = await notesService.deleteNote(noteId);
                        if (success) {
                            setNotes(prev => prev.filter(n => n.$id !== noteId));
                            Toast.show({
                                type: 'success',
                                text1: 'Note Deleted',
                                text2: 'The reflection has been removed.'
                            });
                        }
                    }
                }
            ]
        );
    };

    const handleEditNote = (item: any) => {
        if (!item.contentItem) {
            Toast.show({
                type: 'error',
                text1: 'Material Missing',
                text2: 'The source material is no longer available.'
            });
            return;
        }

        Toast.show({
            type: 'info',
            text1: 'Opening Study Material',
            text2: 'Redirecting to ' + item.contentTitle
        });

        // Pass autoOpenNotes so the detail screen pops the note editor immediately
        navigation.navigate('ContentDetail', {
            item: item.contentItem,
            autoOpenNotes: true
        });
    };

    const renderNoteItem = ({ item }: { item: any }) => (
        <View className="bg-white dark:bg-slate-900 mx-6 mb-4 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[2px] mb-1">
                        {item.contentSubject || 'Nursing Module'}
                    </Text>
                    <Text className="text-base font-black text-slate-900 dark:text-white leading-tight" numberOfLines={1}>
                        {item.contentTitle}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleDeleteNote(item.$id)}
                    className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-2xl"
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <View className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl mb-4">
                <Text className="text-slate-600 dark:text-slate-300 text-[13px] leading-5" numberOfLines={4}>
                    {item.text}
                </Text>
            </View>

            <View className="flex-row justify-between items-center pt-2">
                <View className="flex-row items-center">
                    <MaterialCommunityIcons name="clock-outline" size={12} color={isDark ? "#475569" : "#94A3B8"} />
                    <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                        {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => handleEditNote(item)}
                    className="flex-row items-center bg-blue-600 px-5 py-2.5 rounded-2xl shadow-sm shadow-blue-500/20"
                >
                    <MaterialCommunityIcons name="pencil" size={12} color="white" />
                    <Text className="text-[10px] font-black text-white uppercase tracking-widest ml-2">Edit Reflection</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-white dark:bg-slate-950">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView className="flex-1" edges={['top']}>

                {/* Header */}
                <View className="flex-row items-center px-6 py-4 justify-between">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-11 h-11 items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800"
                    >
                        <MaterialCommunityIcons name="chevron-left" size={28} color={isDark ? "#FFFFFF" : "#0F172A"} />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Study Notebook</Text>
                        <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{notes.length} Reflections</Text>
                    </View>
                    <View className="w-11" />
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563EB" />
                    </View>
                ) : (
                    <FlatList
                        data={notes}
                        renderItem={renderNoteItem}
                        keyExtractor={item => item.$id}
                        contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
                        }
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center mt-20 px-10">
                                <View className="w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-[40px] items-center justify-center mb-6 border border-slate-100 dark:border-slate-900">
                                    <MaterialCommunityIcons name="notebook-outline" size={44} color={isDark ? "#1E293B" : "#CBD5E1"} />
                                </View>
                                <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Notebook Empty</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-center font-bold text-xs leading-5">Tap the blue notepad icon while studying any module to save your reflections here.</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
};

export default NotebookScreen;
