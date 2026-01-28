import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    StatusBar,
    ScrollView,
    Image,
    Dimensions,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionStatus, redeemAccessCode } from '../services/subscription';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatProgram, formatYear } from '../utils/formatters';
import { getNotifications } from '../services/notifications';
import { AppNotification } from '../types';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const AccountScreen = ({ navigation }: any) => {
    const { user, signOut } = useAuth();
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const [subscription, setSubscription] = useState<any>(null);
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
                    text1: 'Success',
                    text2: `Subscription extended by ${result.durationDays} days!`
                });
                setCode('');
                fetchSub();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
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
        <View className="flex-1 bg-white dark:bg-slate-950">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    {/* Minimalist Top Header */}
                    <View className="px-6 py-4 flex-row justify-between items-center">
                        <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">My Account</Text>
                        <TouchableOpacity
                            onPress={signOut}
                            className="bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800"
                        >
                            <Text className="text-red-500 font-bold text-xs uppercase tracking-widest">Sign Out</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Section */}
                    <View className="items-center mt-4 pb-6 border-b border-slate-50 dark:border-slate-900">
                        <View
                            className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[36px] items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm relative overflow-hidden mb-4"
                        >
                            {user?.avatarUrl ? (
                                <Image source={{ uri: user.avatarUrl }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                <View className="items-center justify-center">
                                    <Text className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                                        {user?.fullName
                                            ? user.fullName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                                            : 'N'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Text className="text-2xl font-black text-slate-900 dark:text-white mb-1">{user?.fullName}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 font-medium mb-4">{user?.email}</Text>

                        <View className="flex-row items-center gap-2">
                            <View className="bg-brand-surface dark:bg-brand-dark/30 px-3 py-1 rounded-full border border-brand-light/10">
                                <Text className="text-brand dark:text-brand-light font-black text-[10px] uppercase tracking-widest">
                                    {user?.program ? formatProgram(user.program) : 'Loading...'}
                                </Text>
                            </View>
                            <View className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                <Text className="text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                    {user?.yearOfStudy ? `Year ${formatYear(user.yearOfStudy)}` : ''}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Content Section */}
                    <View className="px-6 py-6 bg-slate-50/50 dark:bg-slate-900/50 flex-1">
                        {/* Premium Status Banner */}
                        <View className={`p-8 rounded-[32px] mb-6 flex-row items-center border ${isSubscribed ? 'bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'} shadow-sm`}>
                            <View className={`w-16 h-16 rounded-2xl items-center justify-center mr-5 ${isSubscribed ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                <MaterialCommunityIcons
                                    name={isSubscribed ? "crown" : "account-lock-outline"}
                                    size={34}
                                    color={isSubscribed ? (isDark ? "#60A5FA" : "#2563EB") : (isDark ? "#475569" : "#94A3B8")}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Membership</Text>
                                <Text className="text-slate-900 dark:text-white font-black text-xl">
                                    {fetchingSub ? 'Syncing...' : isSubscribed ? 'Premium Access ✨' : 'Standard Member'}
                                </Text>
                                {isSubscribed && (
                                    <Text className="text-blue-600 dark:text-blue-400 font-bold text-[11px] mt-1">
                                        Active until: {new Date(subscription.endDate).toLocaleDateString()}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Redeem/Upgrade Section - Only visible when NOT subscribed or expired */}
                        {!isSubscribed && !fetchingSub && (
                            <View className="bg-slate-900 dark:bg-slate-900 border border-slate-800 p-8 rounded-[40px] mb-8 shadow-xl shadow-slate-200 dark:shadow-none">
                                <Text className="text-white text-2xl font-black mb-1">Upgrade Account</Text>
                                <Text className="text-slate-400 text-sm font-bold mb-8">Enter your activation code for instant access to premium resources.</Text>

                                <View className="bg-white/10 border border-white/10 rounded-2xl px-5 h-16 flex-row items-center mb-6">
                                    <MaterialCommunityIcons name="tag-outline" size={24} color="white" />
                                    <TextInput
                                        className="flex-1 ml-4 text-white font-black text-xl tracking-[4px]"
                                        placeholder="XXXX-XXXX"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={code}
                                        onChangeText={setCode}
                                        autoCapitalize="characters"
                                        maxLength={14}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleRedeem}
                                    disabled={loading || !code}
                                    className={`bg-white h-16 rounded-2xl items-center justify-center ${(!code || loading) ? 'opacity-50' : ''}`}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#0F172A" />
                                    ) : (
                                        <Text className="text-slate-900 font-black uppercase tracking-widest text-sm">Verify & Upgrade Account</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Settings Links */}
                        <View className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-10">
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Notifications')}
                                className="px-6 py-5 flex-row items-center border-b border-slate-50 dark:border-slate-800"
                            >
                                <View className="relative">
                                    <MaterialCommunityIcons name="bell-outline" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
                                    {unreadCount > 0 && (
                                        <View className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900" />
                                    )}
                                </View>
                                <Text className="flex-1 ml-4 text-slate-900 dark:text-white font-bold">In-App Notifications</Text>
                                {unreadCount > 0 && (
                                    <View className="bg-blue-600 px-2 py-0.5 rounded-full mr-2">
                                        <Text className="text-white text-[10px] font-black">{unreadCount}</Text>
                                    </View>
                                )}
                                <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? "#475569" : "#CBD5E1"} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Privacy')}
                                className="px-6 py-5 flex-row items-center border-b border-slate-50 dark:border-slate-800"
                            >
                                <MaterialCommunityIcons name="shield-check-outline" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
                                <Text className="flex-1 ml-4 text-slate-900 dark:text-white font-bold">Privacy & Security</Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? "#475569" : "#CBD5E1"} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Support')}
                                className="px-6 py-5 flex-row items-center"
                            >
                                <MaterialCommunityIcons name="help-circle-outline" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
                                <Text className="flex-1 ml-4 text-slate-900 dark:text-white font-bold">Nurse Support Desk</Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? "#475569" : "#CBD5E1"} />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-center text-slate-400 font-bold text-[9px] uppercase tracking-[4px] mb-10">
                            Version 1.0.2 • Made for Nurses
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default AccountScreen;
