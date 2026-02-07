import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
  
    RefreshControl,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { flashcardService, Flashcard } from '../services/flashcards';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const FlashcardListScreen = ({ route, navigation }: any) => {
    const { deckId, deckTitle } = route.params;
    const insets = useSafeAreaInsets();

    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Add Card Modal State
    const [isAddVisible, setIsAddVisible] = useState(false);
    const [frontText, setFrontText] = useState('');
    const [backText, setBackText] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchCards = useCallback(async () => {
        const data = await flashcardService.getFlashcards(deckId);
        setFlashcards(data);
        setLoading(false);
        setRefreshing(false);
    }, [deckId]);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

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
                text1: 'Card Added'
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
                            Toast.show({ type: 'success', text1: 'Card Deleted' });
                        }
                    }
                }
            ]
        );
    };

    const renderCardItem = ({ item, index }: { item: Flashcard, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <View style={{
                backgroundColor: Colors.white,
                marginHorizontal: Spacing.md,
                marginBottom: Spacing.sm,
                borderRadius: BorderRadius.xs,
                borderWidth: 1,
                borderColor: Colors.border,
                padding: Spacing.md,
                ...Shadow.small
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...Typography.caption, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase' }}>Question</Text>
                        <Text style={{ ...Typography.body, fontWeight: '700', marginTop: 2 }}>{item.front}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDeleteCard(item.$id)}
                        style={{ padding: 4 }}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                </View>

                <View style={{
                    backgroundColor: Colors.background,
                    padding: Spacing.sm,
                    borderRadius: BorderRadius.xs,
                    borderLeftWidth: 3,
                    borderLeftColor: Colors.primary
                }}>
                    <Text style={{ ...Typography.caption, color: Colors.textMuted, textTransform: 'uppercase' }}>Answer</Text>
                    <Text style={{ ...Typography.body, fontSize: 13, marginTop: 2 }}>{item.back}</Text>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar style="light" backgroundColor={Colors.primaryDark} />

            {/* Toolbar */}
            <View style={{
                paddingTop: insets.top,
                backgroundColor: Colors.primary,
                ...Shadow.small,
                zIndex: 100
            }}>
                <View style={{
                    height: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: Spacing.md
                }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: Spacing.md }}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }} numberOfLines={1}>{deckTitle}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{flashcards.length} Cards</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setIsAddVisible(true)}
                        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <MaterialCommunityIcons name="plus" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={flashcards}
                        renderItem={renderCardItem}
                        keyExtractor={item => item.$id}
                        contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                        }
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: 100, paddingHorizontal: 40 }}>
                                <MaterialCommunityIcons name="cards-outline" size={64} color={Colors.border} />
                                <Text style={{ ...Typography.h2, textAlign: 'center', marginTop: Spacing.md }}>No Cards Yet</Text>
                                <Text style={{ ...Typography.body, textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.sm }}>
                                    Add cards to start studying this deck.
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Floating Action Button for Study */}
            {flashcards.length > 0 && (
                <View style={{ position: 'absolute', bottom: Spacing.lg, left: Spacing.lg, right: Spacing.lg }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('FlashcardStudy', { deckId, deckTitle })}
                        style={{
                            backgroundColor: Colors.primary,
                            height: 52,
                            borderRadius: BorderRadius.xs,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            ...Shadow.medium
                        }}
                    >
                        <MaterialCommunityIcons name="play" size={20} color={Colors.white} />
                        <Text style={{ color: Colors.white, fontWeight: '700', marginLeft: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Study Now
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Add Card Modal */}
            <Modal visible={isAddVisible} transparent animationType="fade">
                <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg }} onPress={() => setIsAddVisible(false)}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <View style={{ backgroundColor: Colors.white, borderRadius: BorderRadius.sm, overflow: 'hidden' }}>
                            <View style={{ padding: Spacing.md, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: Colors.white, fontWeight: '700' }}>New Card</Text>
                                <TouchableOpacity onPress={() => setIsAddVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={20} color={Colors.white} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ padding: Spacing.md }}>
                                <Text style={{ ...Typography.caption, color: Colors.textMuted, marginBottom: 4 }}>QUESTION (FRONT)</Text>
                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: Colors.border,
                                        borderRadius: BorderRadius.xs,
                                        padding: Spacing.sm,
                                        minHeight: 80,
                                        textAlignVertical: 'top'
                                    }}
                                    multiline
                                    value={frontText}
                                    onChangeText={setFrontText}
                                    placeholder="Enter question..."
                                />

                                <Text style={{ ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.md, marginBottom: 4 }}>ANSWER (BACK)</Text>
                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: Colors.border,
                                        borderRadius: BorderRadius.xs,
                                        padding: Spacing.sm,
                                        minHeight: 80,
                                        textAlignVertical: 'top'
                                    }}
                                    multiline
                                    value={backText}
                                    onChangeText={setBackText}
                                    placeholder="Enter answer..."
                                />

                                <TouchableOpacity
                                    onPress={handleAddCard}
                                    disabled={adding}
                                    style={{
                                        backgroundColor: Colors.primary,
                                        height: 44,
                                        borderRadius: BorderRadius.xs,
                                        marginTop: Spacing.lg,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {adding ? <ActivityIndicator color="white" /> : (
                                        <Text style={{ color: Colors.white, fontWeight: '700' }}>CREATE CARD</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Pressable>
            </Modal>
        </View>
    );
};

export default FlashcardListScreen;

