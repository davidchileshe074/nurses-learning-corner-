import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const SupportScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();

    const handleWhatsApp = () => {
        Linking.openURL('https://wa.me/260974123013?text=Hello, I need help with Nurse Learning Corner');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:davidchileshe074@gmail.com');
    };

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
                        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }}>Help & Support</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.md }} showsVerticalScrollIndicator={false}>
                <Animated.View
                    entering={FadeInDown.delay(100).springify()}
                    style={{
                        backgroundColor: Colors.primary,
                        padding: Spacing.xl,
                        borderRadius: BorderRadius.xs,
                        marginBottom: Spacing.lg,
                        position: 'relative',
                        overflow: 'hidden',
                        ...Shadow.medium
                    }}
                >
                    <MaterialCommunityIcons
                        name="help-circle"
                        size={120}
                        color="rgba(255,255,255,0.1)"
                        style={{ position: 'absolute', right: -20, bottom: -20 }}
                    />
                    <Text style={{ ...Typography.h2, color: Colors.white, marginBottom: 4 }}>How can we help?</Text>
                    <Text style={{ ...Typography.body, color: 'rgba(255,255,255,0.8)' }}>Our team is available to assist you with any questions or issues.</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={{ ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm, fontWeight: '700' }}>CONTACT OPTIONS</Text>

                    <TouchableOpacity
                        onPress={handleWhatsApp}
                        style={{
                            backgroundColor: Colors.white,
                            padding: Spacing.md,
                            borderRadius: BorderRadius.xs,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: Spacing.sm,
                            ...Shadow.small
                        }}
                    >
                        <View style={{
                            width: 44,
                            height: 44,
                            backgroundColor: '#e8f5e9',
                            borderRadius: BorderRadius.xs,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: Spacing.md
                        }}>
                            <MaterialCommunityIcons name="whatsapp" size={24} color="#2e7d32" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...Typography.body, fontWeight: '700' }}>Chat on WhatsApp</Text>
                            <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>Fastest response time</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleEmail}
                        style={{
                            backgroundColor: Colors.white,
                            padding: Spacing.md,
                            borderRadius: BorderRadius.xs,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: Spacing.lg,
                            ...Shadow.small
                        }}
                    >
                        <View style={{
                            width: 44,
                            height: 44,
                            backgroundColor: Colors.primaryLight,
                            borderRadius: BorderRadius.xs,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: Spacing.md
                        }}>
                            <MaterialCommunityIcons name="email-outline" size={24} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...Typography.body, fontWeight: '700' }}>Email Support</Text>
                            <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>For detailed inquiries</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View
                    entering={FadeInDown.delay(300).springify()}
                    style={{
                        backgroundColor: Colors.white,
                        padding: Spacing.lg,
                        borderRadius: BorderRadius.xs,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        marginBottom: 40,
                        ...Shadow.small
                    }}
                >
                    <Text style={{ ...Typography.h3, marginBottom: Spacing.md }}>Frequently Asked Questions</Text>

                    <View style={{ marginBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: Spacing.sm }}>
                        <Text style={{ ...Typography.body, fontWeight: '700', marginBottom: 2 }}>How do I redeem a code?</Text>
                        <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>Go to Account {'>'} Enter code in the Redeem section.</Text>
                    </View>

                    <View style={{ marginBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: Spacing.sm }}>
                        <Text style={{ ...Typography.body, fontWeight: '700', marginBottom: 2 }}>Can I use multiple devices?</Text>
                        <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>For security reasons, your account is locked to the primary device you register with.</Text>
                    </View>

                    <View>
                        <Text style={{ ...Typography.body, fontWeight: '700', marginBottom: 2 }}>How can I download content?</Text>
                        <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>Click the download icon on any study material to access it offline.</Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

export default SupportScreen;

