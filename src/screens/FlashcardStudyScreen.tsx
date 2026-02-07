import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,

    Dimensions,
    Animated,
    Modal,
    Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { flashcardService, Flashcard } from '../services/flashcards';
import * as SecureStore from 'expo-secure-store';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const FlashcardStudyScreen = ({ route, navigation }: any) => {
    const { deckId, deckTitle } = route.params;
    const insets = useSafeAreaInsets();

    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isResumeModalVisible, setIsResumeModalVisible] = useState(false);
    const [savedIndex, setSavedIndex] = useState(0);
    const [readyToRender, setReadyToRender] = useState(false);

    // Animation Values
    const flipAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        const fetchCards = async () => {
            const data = await flashcardService.getFlashcards(deckId);
            setFlashcards(data);

            // Check for saved progress
            const saved = await SecureStore.getItemAsync(`fc_pos_${deckId}`);
            if (saved) {
                const index = parseInt(saved, 10);
                if (index > 0 && index < data.length) {
                    setSavedIndex(index);
                    setIsResumeModalVisible(true);
                    setLoading(false);
                    return;
                }
            }

            // If no saved progress, shuffle and start at 0
            setFlashcards([...data].sort(() => Math.random() - 0.5));
            setLoading(false);
            setReadyToRender(true);
        };
        fetchCards();
    }, [deckId]);

    const handleResume = (shouldResume: boolean) => {
        if (shouldResume) {
            setCurrentIndex(savedIndex);
        } else {
            setCurrentIndex(0);
            setFlashcards(prev => [...prev].sort(() => Math.random() - 0.5));
        }
        setIsResumeModalVisible(false);
        setReadyToRender(true);
    };

    // Save progress as we go
    useEffect(() => {
        if (readyToRender && flashcards.length > 0) {
            SecureStore.setItemAsync(`fc_pos_${deckId}`, currentIndex.toString());
        }
    }, [currentIndex, readyToRender, deckId]);

    const handleFlip = () => {
        if (isFlipped) {
            Animated.spring(flipAnim, {
                toValue: 0,
                friction: 8,
                tension: 10,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(flipAnim, {
                toValue: 180,
                friction: 8,
                tension: 10,
                useNativeDriver: true,
            }).start();
        }
        setIsFlipped(!isFlipped);
    };

    const nextCard = () => {
        if (currentIndex < flashcards.length - 1) {
            // Reset flip before moving to next
            if (isFlipped) {
                handleFlip();
                setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                }, 200);
            } else {
                setCurrentIndex(prev => prev + 1);
            }
        } else {
            navigation.goBack();
        }
    };

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const frontAnimatedStyle = {
        transform: [{ rotateY: frontInterpolate }]
    };

    const backAnimatedStyle = {
        transform: [{ rotateY: backInterpolate }]
    };

    // Smoothing out the progress bar
    const progressAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (flashcards.length > 0) {
            Animated.spring(progressAnim, {
                toValue: (currentIndex + 1) / flashcards.length,
                useNativeDriver: false,
                friction: 10,
                tension: 40
            }).start();
        }
    }, [currentIndex, flashcards.length, progressAnim]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const currentCard = flashcards[currentIndex];

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
                        <MaterialCommunityIcons name="close" size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }} numberOfLines={1}>Study Deck</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{deckTitle}</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full }}>
                        <Text style={{ color: Colors.white, fontSize: 13, fontWeight: '700' }}>{currentIndex + 1}/{flashcards.length}</Text>
                    </View>
                </View>
            </View>

            {(!readyToRender || isResumeModalVisible) ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Progress Bar Container */}
                    <View style={{ padding: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                        <View style={{ height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' }}>
                            <Animated.View
                                style={{
                                    height: '100%',
                                    backgroundColor: Colors.primary,
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    })
                                }}
                            />
                        </View>
                    </View>

                    {/* Card Container */}
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={handleFlip}
                            style={{ width: '100%', aspectRatio: 3 / 4 }}
                        >
                            {/* Front Side */}
                            <Animated.View
                                style={[
                                    frontAnimatedStyle,
                                    {
                                        backfaceVisibility: 'hidden',
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: Colors.white,
                                        borderRadius: BorderRadius.sm,
                                        borderWidth: 1,
                                        borderColor: Colors.border,
                                        padding: Spacing.xl,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        ...Shadow.medium,
                                        transform: [
                                            { perspective: 1000 },
                                            { rotateY: frontInterpolate }
                                        ]
                                    }
                                ]}
                            >
                                <MaterialCommunityIcons name="help-circle-outline" size={32} color={Colors.primary} style={{ position: 'absolute', top: Spacing.md, left: Spacing.md }} />
                                <Text style={{ ...Typography.h2, textAlign: 'center' }}>{currentCard?.front}</Text>
                                <View style={{ position: 'absolute', bottom: Spacing.md, flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="gesture-tap" size={16} color={Colors.textMuted} />
                                    <Text style={{ ...Typography.caption, marginLeft: 4 }}>Tap to reveal answer</Text>
                                </View>
                            </Animated.View>

                            {/* Back Side */}
                            <Animated.View
                                style={[
                                    backAnimatedStyle,
                                    {
                                        backfaceVisibility: 'hidden',
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: Colors.primaryLight,
                                        borderRadius: BorderRadius.sm,
                                        borderWidth: 1,
                                        borderColor: Colors.primary,
                                        padding: Spacing.xl,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        ...Shadow.medium,
                                        transform: [
                                            { perspective: 1000 },
                                            { rotateY: backInterpolate }
                                        ]
                                    }
                                ]}
                            >
                                <MaterialCommunityIcons name="check-circle-outline" size={32} color={Colors.primary} style={{ position: 'absolute', top: Spacing.md, left: Spacing.md }} />
                                <Text style={{ ...Typography.h2, textAlign: 'center', color: Colors.primaryDark }}>{currentCard?.back}</Text>
                                <View style={{ position: 'absolute', bottom: Spacing.md, flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="gesture-tap" size={16} color={Colors.primary} />
                                    <Text style={{ ...Typography.caption, color: Colors.primary, marginLeft: 4 }}>Tap to hide answer</Text>
                                </View>
                            </Animated.View>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Toggle */}
                    <View style={{ padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }}>
                        <TouchableOpacity
                            onPress={nextCard}
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
                            <Text style={{ color: Colors.white, fontWeight: '700', marginRight: Spacing.sm, textTransform: 'uppercase' }}>
                                {currentIndex < flashcards.length - 1 ? 'Next Card' : 'Finish Session'}
                            </Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Resume Session Modal */}
            <Modal visible={isResumeModalVisible} transparent={true} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.xl }}>
                    <View style={{ backgroundColor: Colors.white, borderRadius: BorderRadius.sm, overflow: 'hidden' }}>
                        <View style={{ padding: Spacing.md, backgroundColor: Colors.primary }}>
                            <Text style={{ color: Colors.white, fontWeight: '700', textAlign: 'center' }}>Resume Session?</Text>
                        </View>
                        <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
                            <MaterialCommunityIcons name="history" size={48} color={Colors.primary} />
                            <Text style={{ ...Typography.body, textAlign: 'center', marginTop: Spacing.md }}>
                                You left off at card {savedIndex + 1} of {flashcards.length}. Would you like to continue?
                            </Text>

                            <TouchableOpacity
                                onPress={() => handleResume(true)}
                                style={{
                                    backgroundColor: Colors.primary,
                                    width: '100%',
                                    height: 44,
                                    borderRadius: BorderRadius.xs,
                                    marginTop: Spacing.lg,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Text style={{ color: Colors.white, fontWeight: '700' }}>CONTINUE SESSION</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleResume(false)}
                                style={{
                                    marginTop: Spacing.md,
                                    padding: Spacing.sm
                                }}
                            >
                                <Text style={{ color: Colors.textMuted, fontWeight: '700', fontSize: 12 }}>START FRESH</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default FlashcardStudyScreen;

