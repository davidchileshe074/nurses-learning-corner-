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
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionStatus, redeemAccessCode } from '../services/subscription';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatProgram, formatYear } from '../utils/formatters';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile, getFileView, deleteFile } from '../services/storage';
import { updateUserProfile } from '../services/auth';
import { useNavigation } from '@react-navigation/native';
import { getNotifications } from '../services/notifications';
import { AppNotification } from '../types';

const { width } = Dimensions.get('window');

const AccountScreen = () => {
    const navigation = useNavigation<any>();
    const { user, signOut, setUser } = useAuth();
    const [subscription, setSubscription] = useState<any>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
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
            Alert.alert('Invalid Code', 'Please enter a valid access code.');
            return;
        }
        setLoading(true);
        try {
            const result = await redeemAccessCode(code, user!.userId);
            if (result.success) {
                Alert.alert('Success', `Subscription extended by ${result.durationDays} days!`);
                setCode('');
                fetchSub();
            } else {
                Alert.alert('Error', result.message || 'Invalid or used code');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setUploading(true);
                const asset = result.assets[0];

                const uploadedFile = await uploadFile({
                    uri: asset.uri,
                    name: asset.fileName || `avatar_${Date.now()}.jpg`,
                    type: asset.mimeType || 'image/jpeg'
                });

                const avatarUrl = getFileView(uploadedFile.$id).toString();

                await updateUserProfile(user!.$id, {
                    avatarUrl: avatarUrl,
                    avatarFileId: uploadedFile.$id
                });

                setUser({
                    ...user!,
                    avatarUrl: avatarUrl,
                    avatarFileId: uploadedFile.$id
                });

                if (user?.avatarFileId) {
                    await deleteFile(user.avatarFileId);
                }

                Alert.alert('Success', 'Profile picture updated!');
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Upload Failed', error.message || 'Could not upload image');
        } finally {
            setUploading(false);
        }
    };

    const isSubscribed = subscription?.status === 'ACTIVE' && new Date(subscription.endDate) > new Date();

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    {/* Minimalist Top Header */}
                    <View className="px-6 py-4 flex-row justify-between items-center">
                        <Text className="text-2xl font-black text-slate-900 tracking-tighter">My Account</Text>
                        <TouchableOpacity
                            onPress={signOut}
                            className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100"
                        >
                            <Text className="text-red-500 font-bold text-xs uppercase tracking-widest">Sign Out</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Section */}
                    <View className="items-center mt-8 pb-10 border-b border-slate-50">
                        <TouchableOpacity
                            onPress={pickImage}
                            disabled={uploading}
                            className="w-28 h-28 bg-slate-50 rounded-[40px] items-center justify-center border-4 border-white shadow-sm relative overflow-hidden mb-6"
                        >
                            {user?.avatarUrl ? (
                                <Image source={{ uri: user.avatarUrl }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                <View className="items-center justify-center">
                                    <Text className="text-4xl font-black text-blue-600">{user?.fullName.charAt(0)}</Text>
                                </View>
                            )}
                            {uploading && (
                                <View className="absolute inset-0 bg-black/20 items-center justify-center">
                                    <ActivityIndicator color="white" />
                                </View>
                            )}
                            <View className="absolute bottom-0 right-0 left-0 bg-blue-600/80 items-center py-1">
                                <MaterialCommunityIcons name="camera" size={12} color="white" />
                            </View>
                        </TouchableOpacity>

                        <Text className="text-2xl font-black text-slate-900 mb-1">{user?.fullName}</Text>
                        <Text className="text-slate-500 font-medium mb-4">{user?.email}</Text>

                        <View className="flex-row items-center gap-2">
                            <View className="bg-brand-surface px-3 py-1 rounded-full border border-brand-light/10">
                                <Text className="text-brand font-black text-[10px] uppercase tracking-widest">
                                    {user?.program ? formatProgram(user.program) : 'Loading...'}
                                </Text>
                            </View>
                            <View className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                                <Text className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                                    {user?.yearOfStudy ? `Year ${formatYear(user.yearOfStudy)}` : ''}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Content Section */}
                    <View className="px-6 py-10 bg-slate-50/50 flex-1">
                        {/* Premium Status Banner */}
                        <View className={`p-8 rounded-[32px] mb-6 flex-row items-center border ${isSubscribed ? 'bg-white border-blue-100 shadow-sm' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <View className={`w-16 h-16 rounded-2xl items-center justify-center mr-5 ${isSubscribed ? 'bg-blue-50' : 'bg-slate-50'}`}>
                                <MaterialCommunityIcons
                                    name={isSubscribed ? "crown" : "account-lock-outline"}
                                    size={34}
                                    color={isSubscribed ? "#2563EB" : "#94A3B8"}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Membership</Text>
                                <Text className="text-slate-900 font-black text-xl">
                                    {fetchingSub ? 'Syncing...' : isSubscribed ? 'Premium Access ✨' : 'Standard Member'}
                                </Text>
                                {isSubscribed && (
                                    <Text className="text-blue-600 font-bold text-[11px] mt-1">
                                        Active until: {new Date(subscription.endDate).toLocaleDateString()}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Redeem/Upgrade Section - Only visible when NOT subscribed or expired */}
                        {!isSubscribed && !fetchingSub && (
                            <View className="bg-slate-900 p-8 rounded-[40px] mb-8 shadow-xl shadow-slate-200">
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
                        <View className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-10">
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Notifications')}
                                className="px-6 py-5 flex-row items-center border-b border-slate-50"
                            >
                                <View className="relative">
                                    <MaterialCommunityIcons name="bell-outline" size={20} color="#64748B" />
                                    {unreadCount > 0 && (
                                        <View className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                                    )}
                                </View>
                                <Text className="flex-1 ml-4 text-slate-900 font-bold">In-App Notifications</Text>
                                {unreadCount > 0 && (
                                    <View className="bg-blue-600 px-2 py-0.5 rounded-full mr-2">
                                        <Text className="text-white text-[10px] font-black">{unreadCount}</Text>
                                    </View>
                                )}
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Privacy')}
                                className="px-6 py-5 flex-row items-center border-b border-slate-50"
                            >
                                <MaterialCommunityIcons name="shield-check-outline" size={20} color="#64748B" />
                                <Text className="flex-1 ml-4 text-slate-900 font-bold">Privacy & Security</Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Support')}
                                className="px-6 py-5 flex-row items-center"
                            >
                                <MaterialCommunityIcons name="help-circle-outline" size={20} color="#64748B" />
                                <Text className="flex-1 ml-4 text-slate-900 font-bold">Nurse Support Desk</Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
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
