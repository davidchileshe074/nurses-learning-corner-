import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, FlatList, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getNotifications, markAsRead, clearAllNotifications } from '../services/notifications';
import { AppNotification } from '../types';

const NotificationsScreen = ({ navigation }: any) => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
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
            case 'CONTENT': return '#2563EB';
            case 'SUBSCRIPTION': return '#F59E0B';
            default: return '#64748B';
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white dark:bg-slate-950">
                <ActivityIndicator size="large" color={isDark ? "#60A5FA" : "#2563EB"} />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                        <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? "#FFFFFF" : "#1E293B"} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900 dark:text-white ml-2">Notifications</Text>
                </View>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={handleClearAll}>
                        <Text className="text-red-500 font-bold text-xs uppercase">Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                className="flex-1 px-6 pt-6"
                data={notifications}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <View className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full items-center justify-center mb-4">
                            <MaterialCommunityIcons name="bell-off-outline" size={40} color={isDark ? "#60A5FA" : "#2563EB"} />
                        </View>
                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">No notifications yet</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-center">
                            We'll notify you when there are new course materials or subscription updates.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => handleMarkAsRead(item.id)}
                        className={`p-5 rounded-3xl mb-4 border flex-row items-start ${item.isRead ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900/30 shadow-sm'}`}
                    >
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${item.isRead ? 'bg-slate-50 dark:bg-slate-800' : 'bg-blue-50 dark:bg-blue-900/40'}`}>
                            <MaterialCommunityIcons name={getIcon(item.type)} size={24} color={getIconColor(item.type)} />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between items-start">
                                <Text className={`text-sm font-black mb-1 ${item.isRead ? 'text-slate-600 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>{item.title}</Text>
                                {!item.isRead && <View className="w-2 h-2 bg-blue-600 rounded-full mt-1" />}
                            </View>
                            <Text className="text-xs text-slate-500 dark:text-slate-400 leading-5 mb-2">{item.message}</Text>
                            <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListFooterComponent={<View className="h-20" />}
            />
        </SafeAreaView>
    );
};

export default NotificationsScreen;
