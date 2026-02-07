import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar as RNStatusBar, ActivityIndicator, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getNotifications, markAsRead, clearAllNotifications } from '../services/notifications';
import { AppNotification } from '../types';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const NotificationsScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        const data = await getNotifications();
        setNotifications(data);
        setLoading(false);
    };

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        setNotifications(updated);
    };

    const handleClearAll = async () => {
        await clearAllNotifications();
        setNotifications([]);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'CONTENT': return 'book-open-variant';
            case 'SUBSCRIPTION': return 'crown';
            default: return 'bell-outline';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'CONTENT': return Colors.primary;
            case 'SUBSCRIPTION': return Colors.warning;
            default: return Colors.textMuted;
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

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
                        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }}>Notifications</Text>
                    </View>
                    {notifications.length > 0 && (
                        <TouchableOpacity onPress={handleClearAll}>
                            <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 12 }}>CLEAR ALL</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: Spacing.md }}
                data={notifications}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: BorderRadius.xs,
                            backgroundColor: Colors.borderLight,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: Spacing.md
                        }}>
                            <MaterialCommunityIcons name="bell-off-outline" size={40} color={Colors.textMuted} />
                        </View>
                        <Text style={{ ...Typography.h2, textAlign: 'center' }}>No notifications</Text>
                        <Text style={{ ...Typography.body, textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.sm }}>
                            We'll notify you when there are new course materials or subscription updates.
                        </Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                        <TouchableOpacity
                            onPress={() => handleMarkAsRead(item.id)}
                            style={{
                                backgroundColor: Colors.white,
                                padding: Spacing.md,
                                borderRadius: BorderRadius.xs,
                                borderWidth: 1,
                                borderColor: item.isRead ? Colors.borderLight : Colors.primaryLight,
                                marginBottom: Spacing.sm,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: item.isRead ? 0.7 : 1,
                                ...Shadow.small
                            }}
                        >
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: BorderRadius.xs,
                                backgroundColor: item.isRead ? Colors.borderLight : Colors.primaryLight,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: Spacing.md
                            }}>
                                <MaterialCommunityIcons name={getIcon(item.type)} size={22} color={getIconColor(item.type)} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                    <Text style={{ ...Typography.body, fontWeight: '700', flex: 1 }} numberOfLines={1}>{item.title}</Text>
                                    {!item.isRead && <View style={{ width: 8, height: 8, backgroundColor: Colors.primary, borderRadius: 4 }} />}
                                </View>
                                <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 }} numberOfLines={2}>{item.message}</Text>
                                <Text style={{ fontSize: 10, color: Colors.textMuted, fontWeight: '700' }}>
                                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                )}
                ListFooterComponent={<View style={{ height: 40 }} />}
            />
        </View>
    );
};

export default NotificationsScreen;

