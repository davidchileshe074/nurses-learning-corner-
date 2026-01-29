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
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { flashcardService, Flashcard } from '../services/flashcards';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const FlashcardListScreen = ({ route, navigation }: any) => {
    const { deckId, deckTitle } = route.params;
    const isDark = useColorScheme() === 'dark';
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Add Card Modal State
    const [isAddVisible, setIsAddVisible] = useState(false);
    const [frontText, setFrontText] = useState('');
    const [backText, setBackText] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchCards = async () => {
        const data = await flashcardService.getFlashcards(deckId);
        setFlashcards(data);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchCards();
    }, [deckId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCards();
    };

    const handleAddCard = async () => {
        if (!frontText.trim() || !backText.trim()) {
            Alert.alert("Input Required", "Please fill both sides of the card.");
            return;
        }

        setAdding(true);
        const card = await flashcardService.addFlashcard(deckId, frontText, backText);
        setAdding(false);

        if (card) {
            setFlashcards([...flashcards, card]);
            setIsAddVisible(false);
            setFrontText('');
            setBackText('');
            Toast.show({
                type: 'success',
                text1: 'Card Added',
                text2: 'One more piece of knowledge saved!'
            });
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        Alert.alert(
            "Delete card",
            "This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const success = await flashcardService.deleteFlashcard(cardId);
                        if (success) {
                            setFlashcards(prev => prev.filter(c => c.$id !== cardId));
                            Toast.show({ type: 'success', text1: 'Knowledge Deleted' });
                        }
                    }
                }
            ]
        );
    };

    const renderCardItem = ({ item }: { item: Flashcard }) => (
        <View className="bg-white dark:bg-slate-900 mx-6 mb-4 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <View className="p-5">
                <View className="flex-row justify-between mb-3">
                    <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Question / Concept</Text>
                    <TouchableOpacity onPress={() => handleDeleteCard(item.$id)}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
                <Text className="text-slate-900 dark:text-white font-bold text-sm mb-4 leading-5">{item.front}</Text>

                <View className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border-l-[3px] border-blue-500">
                    <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Answer / Definition</Text>
                    <Text className="text-slate-600 dark:text-slate-300 text-xs italic leading-5">{item.back}</Text>
                </View>
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
                    <View className="items-center flex-1 mx-4">
                        <Text className="text-lg font-black text-slate-900 dark:text-white tracking-tighter text-center" numberOfLines={1}>{deckTitle}</Text>
                        <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{flashcards.length} Cards Available</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setIsAddVisible(true)}
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
                        data={flashcards}
                        renderItem={renderCardItem}
                        keyExtractor={item => item.$id}
                        contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
                        }
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center mt-20 px-10">
                                <View className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[40px] items-center justify-center mb-6">
                                    <MaterialCommunityIcons name="pencil-plus-outline" size={44} color={isDark ? "#334155" : "#CBD5E1"} />
                                </View>
                                <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Deck is Empty</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-center font-bold text-xs leading-5">Tap the plus icon above to add your first question and answer to this memory deck.</Text>
                            </View>
                        }
                    />
                )}

                {/* Floating Study Button */}
                {flashcards.length > 0 && (
                    <View className="absolute bottom-10 left-0 right-0 px-6">
                        <TouchableOpacity
                            onPress={() => navigation.navigate('FlashcardStudy', { deckId, deckTitle })}
                            activeOpacity={0.95}
                        >
                            <LinearGradient
                                colors={['#2563EB', '#1D4ED8']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="py-5 rounded-[28px] items-center justify-center flex-row shadow-2xl shadow-blue-500/40"
                            >
                                <MaterialCommunityIcons name="lightning-bolt" size={24} color="white" />
                                <Text className="text-white font-black text-base uppercase tracking-[2px] ml-3">Begin Study Session</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Add Card Modal */}
                <Modal visible={isAddVisible} transparent animationType="slide">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1"
                    >
                        <Pressable className="flex-1 bg-black/50" onPress={() => setIsAddVisible(false)} />
                        <View className="bg-white dark:bg-slate-900 rounded-t-[48px] p-8 shadow-2xl">
                            <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 opacity-50" />
                            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-6">Create Knowledge Card</Text>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="space-y-6">
                                    <View>
                                        <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">Card Front (Question)</Text>
                                        <View className="bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                                            <TextInput
                                                placeholder="e.g. What are the 5 signs of inflammation?"
                                                className="text-slate-900 dark:text-white font-bold leading-6 min-h-[80px]"
                                                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                                multiline
                                                value={frontText}
                                                onChangeText={setFrontText}
                                            />
                                        </View>
                                    </View>

                                    <View>
                                        <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">Card Back (Answer)</Text>
                                        <View className="bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                                            <TextInput
                                                placeholder="e.g. Heat, Redness, Swelling, Pain, Loss of Function"
                                                className="text-slate-900 dark:text-white font-bold leading-6 min-h-[80px]"
                                                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                                multiline
                                                value={backText}
                                                onChangeText={setBackText}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleAddCard}
                                    disabled={adding}
                                    className={`w-full py-5 rounded-[24px] mt-10 items-center justify-center flex-row shadow-xl shadow-blue-500/20 ${adding ? 'bg-blue-400' : 'bg-blue-600'}`}
                                >
                                    {adding ? <ActivityIndicator color="white" size="small" className="mr-3" /> : (
                                        <MaterialCommunityIcons name="check-decagram-outline" size={24} color="white" className="mr-3" />
                                    )}
                                    <Text className="text-white font-black text-base uppercase tracking-widest">
                                        {adding ? 'Storing...' : 'Deploy Card'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setIsAddVisible(false)}
                                    className="w-full py-4 mb-4 mt-2 items-center"
                                >
                                    <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cancel Card</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

import { Pressable } from 'react-native'; // Fix for Pressable import
export default FlashcardListScreen;
