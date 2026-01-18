import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionStatus } from '../services/subscription';
import { Subscription } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shadow } from '../theme';
import { formatProgram, formatYear } from '../utils/formatters';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (user) {
                try {
                    const sub = await getSubscriptionStatus(user.userId);
                    setSubscription(sub);
                } catch (error) {
                    console.error('Fetch subscription error:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchSubscription();
    }, [user]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="small" color={Colors.primary} />
            </View>
        );
    }

    const isSubscribed = subscription?.status === 'ACTIVE' && new Date(subscription.endDate) > new Date();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>Good Morning,</Text>
                            <Text style={styles.userName}>{user?.fullName?.split(' ')[0]}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.avatarWrapper}
                            onPress={() => navigation.navigate('Account')}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#1e40af']}
                                style={styles.avatarGradient}
                            >
                                <Text style={styles.avatarText}>{user?.fullName?.charAt(0)}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Subscription Dashboard Card */}
                    <View style={styles.dashboardContainer}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('Account')}
                        >
                            <LinearGradient
                                colors={isSubscribed ? [Colors.primary, '#1e3a8a'] : ['#334155', '#1e293b']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.mainCard}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconCircle}>
                                        <MaterialCommunityIcons
                                            name={isSubscribed ? "check-decagram" : "alert-decagram"}
                                            size={20}
                                            color={isSubscribed ? Colors.primary : '#94a3b8'}
                                        />
                                    </View>
                                    <Text style={styles.cardTitle}>PORTAL ACCESS</Text>
                                </View>

                                <Text style={styles.statusLabel}>{isSubscribed ? 'Premium Academic' : 'Standard Access'}</Text>

                                {isSubscribed ? (
                                    <View style={styles.expiryRow}>
                                        <MaterialCommunityIcons name="calendar-clock" size={14} color="rgba(255,255,255,0.7)" />
                                        <Text style={styles.expiryText}>Membership expires: {new Date(subscription!.endDate).toLocaleDateString()}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.renewAction}>
                                        <Text style={styles.renewActionText}>Unlock All Resources</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.white} />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Quick Stats Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <View style={[styles.statIcon, { backgroundColor: `${Colors.primary}15` }]}>
                                <MaterialCommunityIcons name="book-open-variant" size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>Resources</Text>
                        </View>
                        <View style={styles.statBox}>
                            <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
                                <MaterialCommunityIcons name="download" size={20} color="#16A34A" />
                            </View>
                            <Text style={styles.statValue}>5</Text>
                            <Text style={styles.statLabel}>Saved</Text>
                        </View>
                        <View style={styles.statBox}>
                            <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                                <MaterialCommunityIcons name="clock-outline" size={20} color="#EA580C" />
                            </View>
                            <Text style={styles.statValue}>24h</Text>
                            <Text style={styles.statLabel}>Activity</Text>
                        </View>
                    </View>

                    {/* My Program Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionHeading}>Your Education</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Account')}>
                                <Text style={styles.editLink}>Update</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.programCard}>
                            <LinearGradient
                                colors={['#F1F5F9', '#F8FAFC']}
                                style={styles.programIcon}
                            >
                                <MaterialCommunityIcons name="school" size={24} color={Colors.primary} />
                            </LinearGradient>
                            <View style={styles.programInfo}>
                                <Text style={styles.programName}>{formatProgram(user?.program!)}</Text>
                                <View style={styles.yearBadge}>
                                    <Text style={styles.yearBadgeText}>ACADEMIC YEAR {formatYear(user?.yearOfStudy!)}</Text>
                                </View>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                        </View>
                    </View>

                    {/* Main Action Section */}
                    <View style={styles.actionSection}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('Library')}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#1e40af']}
                                style={styles.ctaCard}
                            >
                                <View style={styles.ctaInfo}>
                                    <Text style={styles.ctaTitle}>Enter Study Library</Text>
                                    <Text style={styles.ctaDesc}>Access all interactive modules and nursing materials</Text>
                                </View>
                                <View style={styles.ctaIcon}>
                                    <MaterialCommunityIcons name="arrow-right-circle" size={32} color={Colors.white} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    greeting: {
        fontSize: 14,
        color: Colors.textLighter,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    userName: {
        ...Typography.h1,
        color: Colors.text,
        fontWeight: '900',
    },
    avatarWrapper: {
        ...Shadow.medium,
    },
    avatarGradient: {
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '800',
    },
    dashboardContainer: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    mainCard: {
        borderRadius: 24,
        padding: Spacing.xl,
        ...Shadow.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 10,
        letterSpacing: 1,
    },
    statusLabel: {
        color: Colors.white,
        fontSize: 26,
        fontWeight: '900',
        marginBottom: Spacing.lg,
    },
    expiryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    expiryText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    renewAction: {
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    renewActionText: {
        color: '#1e293b',
        fontWeight: '800',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    statBox: {
        backgroundColor: Colors.white,
        width: (width - (Spacing.xl * 2 + Spacing.md * 2)) / 3,
        padding: Spacing.md,
        borderRadius: 20,
        alignItems: 'center',
        ...Shadow.small,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textLighter,
        fontWeight: '700',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    section: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
    },
    editLink: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },
    programCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        ...Shadow.small,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    programIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    programInfo: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    programName: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    yearBadge: {
        backgroundColor: Colors.primary + '10',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    yearBadgeText: {
        color: Colors.primary,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    actionSection: {
        paddingHorizontal: Spacing.xl,
    },
    ctaCard: {
        borderRadius: 24,
        padding: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...Shadow.medium,
    },
    ctaInfo: {
        flex: 1,
        paddingRight: Spacing.md,
    },
    ctaTitle: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '900',
    },
    ctaDesc: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
    },
    ctaIcon: {
        opacity: 0.9,
    },
});

export default HomeScreen;


