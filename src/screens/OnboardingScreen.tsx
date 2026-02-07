import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

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
    const insets = useSafeAreaInsets();
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
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
            <StatusBar style="dark" />

            {/* Header / Skip */}
            <View style={{
                paddingTop: insets.top + Spacing.sm,
                paddingHorizontal: Spacing.xl,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                zIndex: 10
            }}>
                <TouchableOpacity onPress={handleSkip} style={{ padding: Spacing.xs }}>
                    <Text style={{ ...Typography.label, color: Colors.primary, fontWeight: '900' }}>SKIP</Text>
                </TouchableOpacity>
            </View>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={ONBOARDING_DATA}
                renderItem={({ item }) => (
                    <View style={{ width, paddingHorizontal: Spacing.xl, justifyContent: 'center', alignItems: 'center' }}>
                        <Animated.View
                            entering={FadeInDown.delay(200).springify()}
                            style={{
                                width: 220,
                                height: 220,
                                backgroundColor: Colors.primaryLight,
                                borderRadius: BorderRadius.md,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: Spacing.xl,
                                borderWidth: 2,
                                borderColor: Colors.primary
                            }}
                        >
                            <MaterialCommunityIcons name={item.icon as any} size={100} color={Colors.primary} />
                        </Animated.View>
                        <Animated.Text
                            entering={FadeInDown.delay(300).springify()}
                            style={{
                                ...Typography.h1,
                                color: Colors.primary,
                                textAlign: 'center',
                                marginBottom: Spacing.sm
                            }}
                        >
                            {item.title}
                        </Animated.Text>
                        <Animated.Text
                            entering={FadeInDown.delay(400).springify()}
                            style={{
                                ...Typography.body,
                                color: Colors.textSecondary,
                                textAlign: 'center',
                                lineHeight: 24,
                                paddingHorizontal: Spacing.md
                            }}
                        >
                            {item.description}
                        </Animated.Text>
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
            <View style={{
                paddingHorizontal: Spacing.xl,
                paddingBottom: insets.bottom + Spacing.xl,
                alignItems: 'center'
            }}>
                {/* Dots */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs, marginBottom: 40 }}>
                    {ONBOARDING_DATA.map((_, index) => (
                        <View
                            key={index}
                            style={{
                                height: 4,
                                width: currentIndex === index ? 24 : 8,
                                borderRadius: 2,
                                backgroundColor: currentIndex === index ? Colors.primary : Colors.border,
                            }}
                        />
                    ))}
                </View>

                {/* Button */}
                <TouchableOpacity
                    onPress={handleNext}
                    style={{
                        backgroundColor: Colors.primary,
                        height: 56,
                        width: '100%',
                        borderRadius: BorderRadius.sm,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...Shadow.small
                    }}
                >
                    <Text style={{
                        color: Colors.white,
                        fontWeight: '900',
                        fontSize: 14,
                        letterSpacing: 1.2
                    }}>
                        {currentIndex === ONBOARDING_DATA.length - 1 ? 'GET STARTED' : 'CONTINUE'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default OnboardingScreen;

