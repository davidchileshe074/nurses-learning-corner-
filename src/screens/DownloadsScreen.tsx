import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLocalDownloads } from '../services/downloads';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionStatus, checkSubscriptionExpiry } from '../services/subscription';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const DownloadsScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [downloads, setDownloads] = useState<any[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const initDownloads = useCallback(async () => {
        try {
            if (user) {
                const sub = await getSubscriptionStatus(user.userId);
                setIsSubscribed(checkSubscriptionExpiry(sub));
            }
            const local = await getLocalDownloads();
            setDownloads(local);
        } catch (error) {
            console.error('[Downloads] Init Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        initDownloads();
        const unsubscribe = navigation.addListener('focus', initDownloads);
        return unsubscribe;
    }, [navigation, initDownloads]);

    const handleRefresh = () => {
        setRefreshing(true);
        initDownloads();
    };

    const handleOpen = (item: any) => {
        if (!isSubscribed) {
            Alert.alert(
                'Access Restricted',
                'Your subscription has expired. Please renew to access your downloaded materials.',
                [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Go to Account', onPress: () => navigation.navigate('Account') }
                ]
            );
            return;
        }
        navigation.navigate('ContentDetail', {
            item: {
                ...item,
                storageFileId: item.localUri.split('/').pop(),
                $id: item.id
            }
        });
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        let icon: any = "file-document-outline";

        if (item.type === 'AUDIO') {
            icon = "headphones";
        } else if (item.type === 'MARKING_KEY') {
            icon = "check-decagram-outline";
        } else if (item.type === 'PAST_PAPER') {
            icon = "file-question-outline";
        }

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <TouchableOpacity
                    onPress={() => handleOpen(item)}
                    activeOpacity={0.7}
                    style={{
                        backgroundColor: Colors.white,
                        marginHorizontal: Spacing.md,
                        marginBottom: Spacing.sm,
                        borderRadius: BorderRadius.xs,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        padding: Spacing.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        ...Shadow.small
                    }}
                >
                    <View style={{
                        width: 48,
                        height: 48,
                        borderRadius: BorderRadius.xs,
                        backgroundColor: Colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: Spacing.md
                    }}>
                        <MaterialCommunityIcons name={icon} size={24} color={Colors.primary} />
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={{ ...Typography.body, fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Text style={Typography.caption}>SAVED: {new Date(item.expiryDate).toLocaleDateString()}</Text>
                            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.border, marginHorizontal: 8 }} />
                            <Text style={{ ...Typography.caption, color: Colors.primary, fontWeight: '700' }}>{item.type}</Text>
                        </View>
                    </View>

                    <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                </TouchableOpacity>
            </Animated.View>
        );
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
                        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }}>My Downloads</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{downloads.length} Offline Materials</Text>
                    </View>
                </View>
            </View>

            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={downloads}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
                        }
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: 100, paddingHorizontal: 40 }}>
                                <MaterialCommunityIcons name="cloud-download-outline" size={64} color={Colors.border} />
                                <Text style={{ ...Typography.h2, textAlign: 'center', marginTop: Spacing.md }}>No Downloads</Text>
                                <Text style={{ ...Typography.body, textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.sm }}>
                                    Materials you download for offline study will appear here.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Library')}
                                    style={{
                                        marginTop: Spacing.xl,
                                        backgroundColor: Colors.primary,
                                        paddingHorizontal: Spacing.xl,
                                        paddingVertical: 12,
                                        borderRadius: BorderRadius.xs
                                    }}
                                >
                                    <Text style={{ color: Colors.white, fontWeight: '700', textTransform: 'uppercase' }}>Browse Library</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
};

export default DownloadsScreen;

