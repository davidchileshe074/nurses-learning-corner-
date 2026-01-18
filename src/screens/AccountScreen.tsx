import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionStatus, redeemAccessCode } from '../services/subscription';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shadow } from '../theme';
import { formatProgram, formatYear } from '../utils/formatters';

const AccountScreen = () => {
    const { user, signOut } = useAuth();
    const [subscription, setSubscription] = useState<any>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingSub, setFetchingSub] = useState(true);

    useEffect(() => {
        fetchSub();
    }, [user]);

    const fetchSub = async () => {
        if (user) {
            try {
                const sub = await getSubscriptionStatus(user.userId);
                setSubscription(sub);
            } catch (error) {
                console.error(error);
            } finally {
                setFetchingSub(false);
            }
        }
    };

    const handleRedeem = async () => {
        if (!code || code.length < 8) {
            Alert.alert('Invalid Code', 'Please enter a valid 12-digit access code.');
            return;
        }
        setLoading(true);
        try {
            const result = await redeemAccessCode(code, user!.userId);
            if (result.success) {
                Alert.alert('Success', `Subscription extended by ${result.durationDays} days!`);
                setCode('');
                fetchSub(); // Refresh subscription status
            } else {
                Alert.alert('Error', result.message || 'Invalid or used code');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const isSubscribed = subscription?.status === 'ACTIVE' && new Date(subscription.endDate) > new Date();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <LinearGradient
                    colors={[Colors.primary, '#1e3a8a']}
                    style={styles.headerGradient}
                >
                    <SafeAreaView edges={['top']} style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{user?.fullName.charAt(0)}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.editAvatar}
                                activeOpacity={0.8}
                                onPress={() => Alert.alert('Coming Soon', 'Profile picture update will be available in the next update.')}
                            >
                                <MaterialCommunityIcons name="camera" size={14} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.name}>{user?.fullName}</Text>
                        <View style={styles.programBadge}>
                            <Text style={styles.programText}>{formatProgram(user?.program!)} • Year {formatYear(user?.yearOfStudy!)}</Text>
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.email}>{user?.email}</Text>
                            <Text style={styles.phone}>{user?.whatsappNumber}</Text>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                <View style={styles.mainContent}>
                    {/* Status Bar */}
                    <LinearGradient
                        colors={isSubscribed ? [Colors.success, '#065f46'] : [Colors.secondary, '#9a3412']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statusCard}
                    >
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusTitleText}>Member Status</Text>
                            <Text style={styles.statusValueText}>
                                {fetchingSub ? '...' : isSubscribed ? 'Premium Access' : 'Basic Member'}
                            </Text>
                        </View>
                        {isSubscribed && subscription?.endDate ? (
                            <View style={styles.expiryBox}>
                                <Text style={styles.expiryLabel}>Valid Until</Text>
                                <Text style={styles.expiryValue}>
                                    {new Date(subscription.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                            </View>
                        ) : (
                            <MaterialCommunityIcons name="crown-outline" size={32} color="rgba(255,255,255,0.4)" />
                        )}
                    </LinearGradient>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Activate Premium</Text>
                        <View style={styles.card}>
                            <Text style={styles.cardInfo}>Enter your 12-digit subscription code to unlock all materials.</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="ticket-confirmation-outline" size={22} color={Colors.primary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="XXXX-XXXX-XXXX"
                                    placeholderTextColor={Colors.textLighter}
                                    value={code}
                                    onChangeText={setCode}
                                    autoCapitalize="characters"
                                    maxLength={14}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.redeemBtn, { opacity: !code || loading ? 0.6 : 1 }]}
                                onPress={handleRedeem}
                                disabled={loading || !code}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, '#1e40af']}
                                    style={styles.redeemBtnGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={Colors.white} size="small" />
                                    ) : (
                                        <Text style={styles.redeemBtnText}>Activate Now</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.menuSection}>
                        <Text style={styles.menuHeader}>Quick Actions</Text>
                        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Notifications', 'Push notifications are currently managed by system settings.')}>
                            <View style={[styles.menuIconContainer, { backgroundColor: '#E0F2FE' }]}>
                                <MaterialCommunityIcons name="bell-outline" size={22} color="#0369A1" />
                            </View>
                            <Text style={styles.menuText}>Notifications</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Security', 'Your account is secured with single-device authentication.')}>
                            <View style={[styles.menuIconContainer, { backgroundColor: '#F0FDF4' }]}>
                                <MaterialCommunityIcons name="shield-check-outline" size={22} color="#166534" />
                            </View>
                            <Text style={styles.menuText}>Privacy & Security</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Support', 'For technical issues, contact: support@nursecorner.com')}>
                            <View style={[styles.menuIconContainer, { backgroundColor: '#FFF7ED' }]}>
                                <MaterialCommunityIcons name="help-circle-outline" size={22} color="#9A3412" />
                            </View>
                            <Text style={styles.menuText}>Help & Support</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => Alert.alert('About', 'Nurse Learning Corner v1.0.2\nDeveloped for Zambian Nursing Excellence.')}>
                            <View style={[styles.menuIconContainer, { backgroundColor: '#F5F3FF' }]}>
                                <MaterialCommunityIcons name="information-outline" size={22} color="#5B21B6" />
                            </View>
                            <Text style={styles.menuText}>About App</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
                        <Text style={styles.logoutText}>Sign Out of Device</Text>
                    </TouchableOpacity>

                    <Text style={styles.versionText}>Nurse Learning Corner • v1.0.2</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingBottom: Spacing.xxl,
    },
    headerGradient: {
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.xxl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        alignItems: 'center',
        ...Shadow.medium,
    },
    profileHeader: {
        alignItems: 'center',
        width: '100%',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: Spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        ...Shadow.medium,
    },
    avatarText: {
        color: Colors.primary,
        fontSize: 42,
        fontWeight: '900',
    },
    editAvatar: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: Colors.secondary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.white,
        ...Shadow.small,
    },
    name: {
        ...Typography.h2,
        color: Colors.white,
        marginBottom: 4,
        fontWeight: '800',
    },
    programBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    programText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.white,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    contactInfo: {
        alignItems: 'center',
        opacity: 0.9,
    },
    email: {
        ...Typography.bodySmall,
        color: Colors.white,
        fontWeight: '500',
    },
    phone: {
        ...Typography.bodySmall,
        color: Colors.white,
        marginTop: 2,
        fontWeight: '500',
    },
    mainContent: {
        paddingHorizontal: Spacing.lg,
        marginTop: -30,
    },
    statusCard: {
        borderRadius: 20,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...Shadow.medium,
        marginBottom: Spacing.xl,
    },
    statusInfo: {
        flex: 1,
    },
    statusTitleText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    statusValueText: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.white,
    },
    expiryBox: {
        alignItems: 'flex-end',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    expiryLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    expiryValue: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.white,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.h3,
        color: Colors.text,
        marginBottom: Spacing.md,
        fontWeight: '800',
        paddingLeft: 4,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: Spacing.xl,
        ...Shadow.small,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    cardInfo: {
        ...Typography.bodySmall,
        color: Colors.textLight,
        marginBottom: Spacing.lg,
        lineHeight: 18,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 16,
        paddingHorizontal: Spacing.md,
        height: 56,
        marginBottom: Spacing.lg,
        backgroundColor: Colors.background,
    },
    inputIcon: {
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 18,
        color: Colors.text,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    redeemBtn: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.medium,
        overflow: 'hidden',
    },
    redeemBtnGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    redeemBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuSection: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadow.small,
        marginBottom: Spacing.xl,
    },
    menuHeader: {
        fontSize: 12,
        color: Colors.textLighter,
        fontWeight: '800',
        padding: Spacing.lg,
        paddingBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        flex: 1,
        ...Typography.body,
        color: Colors.text,
        marginLeft: Spacing.md,
        fontWeight: '700',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        backgroundColor: Colors.white,
        borderWidth: 1.5,
        borderColor: Colors.error,
        borderRadius: 16,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
        gap: 10,
        ...Shadow.small,
    },
    logoutText: {
        color: Colors.error,
        fontWeight: '800',
        fontSize: 16,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: Colors.textLighter,
        marginBottom: Spacing.xxl,
        fontWeight: '600',
    },
});

export default AccountScreen;
