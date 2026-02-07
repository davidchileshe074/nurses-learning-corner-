import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Image,
    Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getSubscriptionStatus, redeemAccessCode } from '../services/subscription';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatProgram, formatYear } from '../utils/formatters';
import { getNotifications } from '../services/notifications';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const { width } = Dimensions.get('window');

const AccountScreen = ({ navigation }: NativeStackScreenProps<any>) => {
    const { user, signOut } = useAuth();
    const insets = useSafeAreaInsets();

    const [subscription, setSubscription] = useState<any>(null); // TODO: Define Subscription type
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingSub, setFetchingSub] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchSub();
        fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        const data = await getNotifications();
        setUnreadCount(data.filter(n => !n.isRead).length);
    };

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
            Toast.show({
                type: 'error',
                text1: 'Invalid Code',
                text2: 'Please enter a valid access code.'
            });
            return;
        }
        setLoading(true);
        try {
            const result = await redeemAccessCode(code, user!.userId);
            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Access Granted'
                });
                setCode('');
                fetchSub();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Redemption Failed',
                    text2: result.message || 'Invalid or used code'
                });
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const isSubscribed = subscription?.status === 'ACTIVE' && new Date(subscription.endDate) > new Date();

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
                        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }}>My Account</Text>
                    </View>
                    <TouchableOpacity
                        onPress={signOut}
                        style={{
                            paddingHorizontal: Spacing.md,
                            paddingVertical: 6,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: BorderRadius.sm
                        }}
                    >
                        <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 12 }}>SIGN OUT</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {/* Profile Header Block */}
                <View style={{ backgroundColor: Colors.white, padding: Spacing.xl, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: BorderRadius.sm,
                        backgroundColor: Colors.primaryLight,
                        borderWidth: 2,
                        borderColor: Colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: Spacing.md,
                        overflow: 'hidden'
                    }}>
                        {user?.avatarUrl ? (
                            <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Text style={{ fontSize: 32, fontWeight: '900', color: Colors.primary }}>
                                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'N'}
                            </Text>
                        )}
                    </View>
                    <Text style={Typography.h1}>{user?.fullName}</Text>
                    <Text style={{ ...Typography.body, color: Colors.textSecondary }}>{user?.email}</Text>

                    <View style={{ flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.sm }}>
                        <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 4, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>{user?.program ? formatProgram(user.program) : 'Loading...'}</Text>
                        </View>
                        <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 4, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.full }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted }}>{user?.yearOfStudy ? `Year ${formatYear(user.yearOfStudy)}` : ''}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ padding: Spacing.md }}>
                    {/* Membership Section */}
                    <Text style={{ ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm, fontWeight: '700' }}>MEMBERSHIP STATUS</Text>
                    <View style={{
                        backgroundColor: Colors.white,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        borderRadius: BorderRadius.md,
                        padding: Spacing.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: Spacing.lg,
                        ...Shadow.small
                    }}>
                        <View style={{
                            width: 48,
                            height: 48,
                            borderRadius: BorderRadius.sm,
                            backgroundColor: isSubscribed ? Colors.primaryLight : Colors.borderLight,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: Spacing.md
                        }}>
                            <MaterialCommunityIcons
                                name={isSubscribed ? "crown" : "account-lock-outline"}
                                size={28}
                                color={isSubscribed ? Colors.primary : Colors.textMuted}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...Typography.body, fontWeight: '700' }}>
                                {fetchingSub ? 'Updating...' : isSubscribed ? 'Premium Access' : 'Standard Access'}
                            </Text>
                            {isSubscribed && (
                                <Text style={{ ...Typography.caption, color: Colors.primary }}>
                                    Active until {new Date(subscription.endDate).toLocaleDateString()}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Redeem Section */}
                    {!isSubscribed && !fetchingSub && (
                        <View style={{
                            backgroundColor: Colors.primaryDark,
                            borderRadius: BorderRadius.md,
                            padding: Spacing.lg,
                            marginBottom: Spacing.lg,
                            ...Shadow.medium
                        }}>
                            <Text style={{ ...Typography.h2, color: Colors.white, marginBottom: 4 }}>Upgrade Account</Text>
                            <Text style={{ ...Typography.caption, color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.lg }}>Enter an access code to unlock all materials.</Text>

                            <TextInput
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    height: 48,
                                    borderRadius: BorderRadius.sm,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    color: Colors.white,
                                    paddingHorizontal: Spacing.md,
                                    marginBottom: Spacing.md,
                                    fontSize: 16,
                                    fontWeight: '700',
                                    letterSpacing: 2
                                }}
                                value={code}
                                onChangeText={setCode}
                                placeholder="NLC-XXXX-XXXX"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                autoCapitalize="characters"
                            />

                            <TouchableOpacity
                                onPress={handleRedeem}
                                disabled={loading || !code}
                                style={{
                                    backgroundColor: Colors.white,
                                    height: 48,
                                    borderRadius: BorderRadius.sm,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color={Colors.primaryDark} />
                                ) : (
                                    <Text style={{ color: Colors.primaryDark, fontWeight: '900' }}>REDEEM ACCESS CODE</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Menu Options */}
                    <Text style={{ ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm, fontWeight: '700' }}>ACCOUNT SETTINGS</Text>
                    <View style={{
                        backgroundColor: Colors.white,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        borderRadius: BorderRadius.md,
                        overflow: 'hidden',
                        marginBottom: Spacing.xl,
                        ...Shadow.small
                    }}>
                        {[
                            { name: 'Study Notebook', icon: 'book-edit-outline', screen: 'Notebook', color: Colors.primary },
                            { name: 'Memory Decks', icon: 'cards-variant', screen: 'FlashcardDecks', color: Colors.primary },
                            { name: 'Notifications', icon: 'bell-outline', screen: 'Notifications', color: Colors.text, badge: unreadCount },
                            { name: 'Privacy Policy', icon: 'shield-check-outline', screen: 'Privacy', color: Colors.textMuted },
                            { name: 'Support Helpdesk', icon: 'help-circle-outline', screen: 'Support', color: Colors.textMuted }
                        ].map((item, index, arr) => (
                            <TouchableOpacity
                                key={item.name}
                                onPress={() => navigation.navigate(item.screen)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: Spacing.md,
                                    borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                                    borderBottomColor: Colors.borderLight
                                }}
                            >
                                <View style={{ width: 32, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
                                </View>
                                <Text style={{ flex: 1, marginLeft: Spacing.md, fontWeight: '600' }}>{item.name}</Text>
                                {item.badge ? (
                                    <View style={{ backgroundColor: Colors.error, paddingHorizontal: 6, borderRadius: 10, marginRight: Spacing.sm }}>
                                        <Text style={{ color: Colors.white, fontSize: 10, fontWeight: '700' }}>{item.badge}</Text>
                                    </View>
                                ) : null}
                                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={{ textAlign: 'center', ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.xl }}>
                        VERSION 1.0.5 • NURSE LEARNING CORNER
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default AccountScreen;

