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
    Modal,
    TextInput,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { flashcardService, FlashcardDeck } from '../services/flashcards';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const FlashcardDecksScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const isDark = useColorScheme() === 'dark';
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Create Deck Modal State
    const [isCreateVisible, setIsCreateVisible] = useState(false);
    const [newDeckTitle, setNewDeckTitle] = useState('');
    const [newDeckSubject, setNewDeckSubject] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchDecks = async () => {
        if (!user) return;
        const data = await flashcardService.getUserDecks(user.userId);
        setDecks(data);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchDecks();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDecks();
    };

    const handleCreateDeck = async () => {
        if (!user || !newDeckTitle.trim()) return;

        setCreating(true);
        const deck = await flashcardService.createDeck(
            user.userId,
            newDeckTitle,
            newDeckSubject
        );
        setCreating(false);

        if (deck) {
            setDecks([deck, ...decks]);
            setIsCreateVisible(false);
            setNewDeckTitle('');
            setNewDeckSubject('');
            Toast.show({
                type: 'success',
                text1: 'Deck Created',
                text2: `${newDeckTitle} is ready for cards!`
            });
            // Navigate to deck detail to start adding cards
            navigation.navigate('FlashcardList', { deckId: deck.$id, deckTitle: deck.title });
        }
    };

    const renderDeckItem = React.useCallback(({ item }: { item: FlashcardDeck }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('FlashcardList', { deckId: item.$id, deckTitle: item.title })}
            activeOpacity={0.8}
            className="bg-white dark:bg-slate-900 mx-6 mb-4 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
        >
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1">
                    <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[2px] mb-1">
                        {item.subject || 'Nursing Revision'}
                    </Text>
                    <Text className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                        {item.title}
                    </Text>
                </View>
                <View className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-2xl items-center justify-center">
                    <MaterialCommunityIcons name="cards-outline" size={24} color={isDark ? "#60A5FA" : "#2563EB"} />
                </View>
            </View>

            <View className="flex-row items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                <View className="flex-row items-center">
                    <MaterialCommunityIcons name="clock-outline" size={14} color={isDark ? "#475569" : "#94A3B8"} />
                    <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                        Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                </View>
                <TouchableOpacity
                    className="flex-row items-center bg-blue-600 px-4 py-2 rounded-xl"
                    onPress={() => navigation.navigate('FlashcardStudy', { deckId: item.$id, deckTitle: item.title })}
                >
                    <MaterialCommunityIcons name="play" size={16} color="white" />
                    <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-1.5">Study Now</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    ), [isDark, navigation]);

    return (
        <View className="flex-1 bg-white dark:bg-slate-950">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView className="flex-1" edges={['top']}>

                {/* Header */}
                <View className="flex-row items-center px-6 py-4 justify-between">
                    <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">My Memory Decks</Text>
                    <TouchableOpacity
                        onPress={() => setIsCreateVisible(true)}
                        className="w-11 h-11 items-center justify-center bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20"
                    >
                        <MaterialCommunityIcons name="plus" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563EB" />
                    </View>
                ) : (
                    <FlatList
                        data={decks}
                        renderItem={renderDeckItem}
                        keyExtractor={item => item.$id}
                        contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
                        }
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center mt-20 px-10">
                                <View className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[40px] items-center justify-center mb-6">
                                    <MaterialCommunityIcons name="cards-variant" size={48} color={isDark ? "#334155" : "#CBD5E1"} />
                                </View>
                                <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-3">No Decks Found</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-center font-bold text-xs leading-5">Create your first revision deck to start mastering nursing concepts with spaced-repetition.</Text>
                                <TouchableOpacity
                                    onPress={() => setIsCreateVisible(true)}
                                    className="mt-8 bg-blue-600 px-8 py-4 rounded-[20px] shadow-xl shadow-blue-500/10"
                                >
                                    <Text className="text-white font-black uppercase tracking-widest text-[11px]">Create Your First Deck</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}

                {/* Create Deck Modal */}
                <Modal visible={isCreateVisible} transparent animationType="fade">
                    <View className="flex-1 bg-black/60 justify-center px-6">
                        <View className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl">
                            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2">New Memory Deck</Text>
                            <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest mb-8">Organize your flashcards</Text>

                            <View className="space-y-4">
                                <View className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <TextInput
                                        placeholder="Deck Title (e.g. Midwifery 101)"
                                        className="text-slate-900 dark:text-white font-bold"
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        value={newDeckTitle}
                                        onChangeText={setNewDeckTitle}
                                    />
                                </View>
                                <View className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <TextInput
                                        placeholder="Subject (Optional)"
                                        className="text-slate-900 dark:text-white font-bold"
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        value={newDeckSubject}
                                        onChangeText={setNewDeckSubject}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleCreateDeck}
                                disabled={creating}
                                className={`w-full py-5 rounded-[24px] mt-8 items-center justify-center flex-row shadow-xl shadow-blue-500/20 ${creating ? 'bg-blue-400' : 'bg-blue-600'}`}
                            >
                                {creating ? <ActivityIndicator color="white" size="small" className="mr-3" /> : null}
                                <Text className="text-white font-black text-base uppercase tracking-widest">
                                    {creating ? 'Creating...' : 'Create Deck'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setIsCreateVisible(false)}
                                className="w-full py-4 mt-2 items-center"
                            >
                                <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Go Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

export default FlashcardDecksScreen;
