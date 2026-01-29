import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    useColorScheme,
    Dimensions,
    Animated,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { flashcardService, Flashcard } from '../services/flashcards';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

const FlashcardStudyScreen = ({ route, navigation }: any) => {
    const { deckId, deckTitle } = route.params;
    const isDark = useColorScheme() === 'dark';
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
            // We don't shuffle if resuming to keep the user's perceived order consistent
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
    }, [currentIndex, readyToRender]);

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

    if (loading) {
        return (
            <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    const currentCard = flashcards[currentIndex];

    return (
        <View className="flex-1 bg-white dark:bg-slate-950">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>

                {/* Header */}
                <View className="flex-row items-center px-6 py-4 justify-between">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-11 h-11 items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl"
                    >
                        <MaterialCommunityIcons name="close" size={24} color={isDark ? "#FFFFFF" : "#0F172A"} />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[2px] mb-0.5">Study Session</Text>
                        <Text className="text-sm font-black text-slate-900 dark:text-white" numberOfLines={1}>{deckTitle}</Text>
                    </View>
                    <View className="bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800">
                        <Text className="text-blue-600 dark:text-blue-400 font-black text-[10px]">{currentIndex + 1} / {flashcards.length}</Text>
                    </View>
                </View>

                {/* Defer rendering until choice is made */}
                {(!readyToRender || isResumeModalVisible) ? (
                    <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text className="mt-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Resuming Session...</Text>
                    </View>
                ) : (
                    <>
                        {/* Card Container */}
                        <View className="flex-1 items-center justify-center px-6">
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={handleFlip}
                                className="w-full aspect-[4/5] relative"
                            >
                                {/* Front Side */}
                                <Animated.View
                                    style={[
                                        frontAnimatedStyle,
                                        { backfaceVisibility: 'hidden' }
                                    ]}
                                    className="absolute inset-0 bg-white dark:bg-slate-900 rounded-[48px] p-10 items-center justify-center border-2 border-slate-50 dark:border-slate-800 shadow-2xl elevation-10"
                                >
                                    <View className="absolute top-10 left-10">
                                        <MaterialCommunityIcons name="help-circle-outline" size={32} color={isDark ? "#1E293B" : "#F1F5F9"} />
                                    </View>
                                    <Text className="text-2xl font-black text-slate-900 dark:text-white text-center leading-[38px]">
                                        {currentCard?.front}
                                    </Text>
                                    <View className="absolute bottom-10 flex-row items-center">
                                        <MaterialCommunityIcons name="gesture-tap" size={20} color={isDark ? "#475569" : "#94A3B8"} />
                                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Tap to Flip</Text>
                                    </View>
                                </Animated.View>

                                {/* Back Side */}
                                <Animated.View
                                    style={[
                                        backAnimatedStyle,
                                        { backfaceVisibility: 'hidden' }
                                    ]}
                                    className="absolute inset-0 bg-blue-600 rounded-[48px] p-10 items-center justify-center shadow-2xl elevation-10"
                                >
                                    <View className="absolute top-10 left-10">
                                        <MaterialCommunityIcons name="check-decagram-outline" size={32} color="rgba(255,255,255,0.2)" />
                                    </View>
                                    <Text className="text-2xl font-black text-white text-center leading-[38px]">
                                        {currentCard?.back}
                                    </Text>
                                    <View className="absolute bottom-10 flex-row items-center">
                                        <MaterialCommunityIcons name="gesture-tap" size={20} color="rgba(255,255,255,0.6)" />
                                        <Text className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-2">Tap to hide</Text>
                                    </View>
                                </Animated.View>
                            </TouchableOpacity>
                        </View>

                        {/* Footer Controls */}
                        <View className="px-10 pb-12 pt-6">
                            <View className="flex-row justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800">
                                <View className="flex-1">
                                    <Text className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">Session Progress</Text>
                                    <View className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <Animated.View
                                            className="h-full bg-blue-600 rounded-full"
                                            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={nextCard}
                                    activeOpacity={0.8}
                                    className="ml-6 bg-blue-600 w-14 h-14 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/30"
                                >
                                    <MaterialCommunityIcons
                                        name={currentIndex < flashcards.length - 1 ? "arrow-right" : "check"}
                                        size={28}
                                        color="white"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {/* Premium Resume Study Modal */}
                <Modal
                    visible={isResumeModalVisible}
                    transparent={true}
                    animationType="fade"
                >
                    <View className="flex-1 bg-black/70 justify-center px-8">
                        <View className="bg-white dark:bg-slate-900 w-full rounded-[48px] p-8 shadow-2xl border border-white/10 overflow-hidden">
                            <View className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-[30px] items-center justify-center mb-8 self-center">
                                <MaterialCommunityIcons name="cards-outline" size={40} color="#2563EB" />
                            </View>

                            <Text className="text-3xl font-black text-slate-900 dark:text-white text-center mb-3 tracking-tighter">Resume Prep?</Text>
                            <Text className="text-slate-400 dark:text-slate-500 text-center font-bold text-[10px] uppercase tracking-[3px] mb-12">
                                You left off at Card {savedIndex + 1} of {flashcards.length}
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
                                    <Text className="text-white font-black text-base uppercase tracking-[2px] ml-3">Continue Session</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleResume(false)}
                                activeOpacity={0.7}
                                className="w-full py-5 rounded-[24px] items-center justify-center bg-slate-50 dark:bg-slate-800/50"
                            >
                                <Text className="text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest">Start Fresh (Shuffle)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

export default FlashcardStudyScreen;
