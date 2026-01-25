import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, useWindowDimensions, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_DATA = [
    {
        id: '1',
        title: 'Welcome to NLC',
        description: 'Your comprehensive digital library for nursing excellence. Everything you need, right at your fingertips.',
        icon: 'school-outline',
    },
    {
        id: '2',
        title: 'Curated Materials',
        description: 'Access verified notes, past papers, and audio guides tailored exactly to your nursing program.',
        icon: 'book-open-page-variant-outline',
    },
    {
        id: '3',
        title: 'Study Anywhere',
        description: 'Download content for offline access. Your learning journey continues even without an internet connection.',
        icon: 'download-circle-outline',
    },
    {
        id: '4',
        title: 'Track Progress',
        description: 'Stay organized, track your reading history, and excel in your nursing career with confidence.',
        icon: 'chart-timeline-variant',
    },
];

const OnboardingScreen = ({ navigation }: any) => {
    const { width } = useWindowDimensions();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = async () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            // Complete Onboarding
            await SecureStore.setItemAsync('hasOnboarded', 'true');
            navigation.replace('Login');
        }
    };

    const handleSkip = async () => {
        await SecureStore.setItemAsync('hasOnboarded', 'true');
        navigation.replace('Login');
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* Header / Skip */}
            <View className="flex-row justify-end p-6">
                <TouchableOpacity onPress={handleSkip}>
                    <Text className="text-slate-500 font-bold text-base">Skip</Text>
                </TouchableOpacity>
            </View>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={ONBOARDING_DATA}
                renderItem={({ item }) => (
                    <View style={{ width }} className="items-center px-6 justify-center">
                        <View className="w-56 h-56 bg-blue-50 rounded-full items-center justify-center mb-8">
                            <MaterialCommunityIcons name={item.icon as any} size={80} color="#2563EB" />
                        </View>
                        <Text className="text-3xl font-black text-slate-900 text-center mb-3 tracking-tight">
                            {item.title}
                        </Text>
                        <Text className="text-slate-500 text-base text-center leading-relaxed font-medium px-4">
                            {item.description}
                        </Text>
                    </View>
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                keyExtractor={(item) => item.id}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            />

            {/* Footer */}
            <View className="px-8 pb-12 pt-4 items-center">
                {/* Dots */}
                <View className="flex-row justify-center mb-8 space-x-2">
                    {ONBOARDING_DATA.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2 rounded-full transition-all ${currentIndex === index ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'}`}
                        />
                    ))}
                </View>

                {/* Button */}
                {currentIndex === ONBOARDING_DATA.length - 1 ? (
                    <TouchableOpacity
                        onPress={handleNext}
                        className="bg-blue-600 h-14 w-full rounded-2xl items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98]"
                    >
                        <Text className="text-white font-bold text-base uppercase tracking-widest">
                            Get Started
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={handleNext}
                        className="bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.80]"
                    >
                        <MaterialCommunityIcons name="arrow-right" size={28} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

export default OnboardingScreen;
