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
    Pressable,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { flashcardService, FlashcardDeck } from '../services/flashcards';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';
import LoadingView from '../components/LoadingView';

const FlashcardDecksScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Create Deck Modal State
    const [isCreateVisible, setIsCreateVisible] = useState(false);
    const [newDeckTitle, setNewDeckTitle] = useState('');
    const [newDeckSubject, setNewDeckSubject] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchDecks = useCallback(async () => {
        if (!user) return;
        const data = await flashcardService.getUserDecks(user.userId);
        setDecks(data);
        setLoading(false);
        setRefreshing(false);
    }, [user]);

    useEffect(() => {
        fetchDecks();
    }, [fetchDecks]);

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
                text1: 'Deck Created'
            });
            navigation.navigate('FlashcardList', { deckId: deck.$id, deckTitle: deck.title });
        }
    };

    const renderDeckItem = ({ item, index }: { item: FlashcardDeck, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <TouchableOpacity
                onPress={() => navigation.navigate('FlashcardList', { deckId: item.$id, deckTitle: item.title })}
                activeOpacity={0.7}
                style={{
                    backgroundColor: Colors.white,
                    marginHorizontal: Spacing.md,
                    marginBottom: Spacing.sm,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    padding: Spacing.md,
                    ...Shadow.small
                }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...Typography.caption, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase' }}>
                            {item.subject || 'General'}
                        </Text>
                        <Text style={{ ...Typography.h3, marginTop: 2 }}>{item.title}</Text>
                    </View>
                    <View style={{ width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="cards-outline" size={20} color={Colors.primary} />
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight }}>
                    <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
                        {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: Colors.primary,
                            paddingHorizontal: Spacing.md,
                            paddingVertical: 6,
                            borderRadius: BorderRadius.sm
                        }}
                        onPress={() => navigation.navigate('FlashcardStudy', { deckId: item.$id, deckTitle: item.title })}
                    >
                        <MaterialCommunityIcons name="play" size={14} color={Colors.white} />
                        <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 11, marginLeft: 4, textTransform: 'uppercase' }}>Study</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
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
                        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }}>Memory Decks</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{decks.length} Decks</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setIsCreateVisible(true)}
                        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <MaterialCommunityIcons name="plus" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1 }}>
                {loading ? (
                    <LoadingView message="Syncing Decks..." />
                ) : (
                    <FlatList
                        data={decks}
                        renderItem={renderDeckItem}
                        keyExtractor={item => item.$id}
                        contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                        }
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: 100, paddingHorizontal: 40 }}>
                                <MaterialCommunityIcons name="cards-variant" size={64} color={Colors.border} />
                                <Text style={{ ...Typography.h2, textAlign: 'center', marginTop: Spacing.md }}>No Decks Yet</Text>
                                <Text style={{ ...Typography.body, textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.sm }}>
                                    Create a revision deck to start mastering nursing concepts.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setIsCreateVisible(true)}
                                    style={{
                                        marginTop: Spacing.xl,
                                        backgroundColor: Colors.primary,
                                        paddingHorizontal: Spacing.xl,
                                        paddingVertical: 12,
                                        borderRadius: BorderRadius.sm
                                    }}
                                >
                                    <Text style={{ color: Colors.white, fontWeight: '700', textTransform: 'uppercase' }}>Create First Deck</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Create Deck Modal */}
            <Modal visible={isCreateVisible} transparent animationType="fade">
                <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg }} onPress={() => setIsCreateVisible(false)}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <View style={{ backgroundColor: Colors.white, borderRadius: BorderRadius.md, overflow: 'hidden' }}>
                            <View style={{ padding: Spacing.md, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: Colors.white, fontWeight: '700' }}>New Deck</Text>
                                <TouchableOpacity onPress={() => setIsCreateVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={20} color={Colors.white} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ padding: Spacing.md }}>
                                <Text style={{ ...Typography.caption, color: Colors.textMuted, marginBottom: 4 }}>DECK TITLE</Text>
                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: Colors.border,
                                        borderRadius: BorderRadius.sm,
                                        padding: Spacing.sm,
                                        height: 44
                                    }}
                                    value={newDeckTitle}
                                    onChangeText={setNewDeckTitle}
                                    placeholder="e.g. Midwifery 101"
                                />

                                <Text style={{ ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.md, marginBottom: 4 }}>SUBJECT (OPTIONAL)</Text>
                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: Colors.border,
                                        borderRadius: BorderRadius.sm,
                                        padding: Spacing.sm,
                                        height: 44
                                    }}
                                    value={newDeckSubject}
                                    onChangeText={setNewDeckSubject}
                                    placeholder="e.g. Nursing Module 2"
                                />

                                <TouchableOpacity
                                    onPress={handleCreateDeck}
                                    disabled={creating}
                                    style={{
                                        backgroundColor: Colors.primary,
                                        height: 44,
                                        borderRadius: BorderRadius.xs,
                                        marginTop: Spacing.lg,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {creating ? <ActivityIndicator color="white" /> : (
                                        <Text style={{ color: Colors.white, fontWeight: '700' }}>CREATE DECK</Text>
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

export default FlashcardDecksScreen;

