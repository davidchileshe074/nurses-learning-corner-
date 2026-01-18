import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLocalDownloads } from '../services/downloads';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionStatus, checkSubscriptionExpiry } from '../services/subscription';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shadow } from '../theme';

const DownloadsScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [downloads, setDownloads] = useState<any[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const checkSub = async () => {
            if (user) {
                const sub = await getSubscriptionStatus(user.userId);
                setIsSubscribed(checkSubscriptionExpiry(sub));
            }
        };

        const fetchDownloads = async () => {
            const local = await getLocalDownloads();
            setDownloads(local);
        };

        checkSub();
        fetchDownloads();

        const unsubscribe = navigation.addListener('focus', () => {
            fetchDownloads();
            checkSub();
        });

        return unsubscribe;
    }, [navigation, user]);

    const handleOpen = (item: any) => {
        if (!isSubscribed) {
            Alert.alert('Subscription Expired', 'Please renew your subscription to access downloaded content.');
            return;
        }
        navigation.navigate('ContentDetail', { item: { ...item, storageFileId: item.localUri.split('/').pop() } });
    };

    const renderItem = ({ item }: { item: any }) => {
        let iconName: any = "file-document-outline";
        let iconColor = Colors.primary;

        if (item.type === 'AUDIO') {
            iconName = "headphones";
            iconColor = "#8b5cf6";
        } else if (item.type === 'VIDEO') {
            iconName = "play-circle-outline";
            iconColor = "#ef4444";
        } else if (item.type === 'NOTES') {
            iconName = "file-document-outline";
            iconColor = Colors.primary;
        }

        return (
            <TouchableOpacity
                style={styles.downloadItem}
                onPress={() => handleOpen(item)}
                activeOpacity={0.8}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${iconColor}10` }]}>
                    <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
                </View>

                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.expiryBadge}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.textLighter} />
                            <Text style={styles.itemExpiry}>Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
                        </View>
                        <View style={[styles.typeBadge, { backgroundColor: `${iconColor}15` }]}>
                            <Text style={[styles.typeBadgeText, { color: iconColor }]}>{item.type}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionIcon}>
                    <MaterialCommunityIcons name="arrow-right-circle-outline" size={24} color={Colors.border} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            <View style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Downloads</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.dot} />
                            <Text style={styles.subtitle}>OFFLINE MODE READY</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            <FlatList
                data={downloads}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<View style={{ height: Spacing.md }} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <LinearGradient
                            colors={['#f1f5f9', '#e2e8f0']}
                            style={styles.emptyIconCircle}
                        >
                            <MaterialCommunityIcons name="cloud-download-outline" size={64} color={Colors.border} />
                        </LinearGradient>
                        <Text style={styles.emptyText}>No local materials</Text>
                        <Text style={styles.emptySubText}>Content you download for offline use will be stored here securely.</Text>

                        <TouchableOpacity
                            style={styles.browseBtn}
                            onPress={() => navigation.navigate('Library')}
                        >
                            <Text style={styles.browseBtnText}>Browse Library</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.white,
        paddingBottom: Spacing.md,
        ...Shadow.small,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    headerContent: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.sm,
    },
    title: {
        ...Typography.h1,
        color: Colors.text,
        fontWeight: '900',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
        marginRight: 6,
    },
    subtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textLight,
        letterSpacing: 1,
    },
    list: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    downloadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: 20,
        marginBottom: Spacing.md,
        ...Shadow.small,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    expiryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 6,
        gap: 4,
    },
    itemExpiry: {
        fontSize: 10,
        color: Colors.textLighter,
        fontWeight: '600',
    },
    typeBadge: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    actionIcon: {
        marginLeft: Spacing.sm,
        opacity: 0.5,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: Spacing.xxl,
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    emptyText: {
        ...Typography.h2,
        color: Colors.text,
        textAlign: 'center',
    },
    emptySubText: {
        ...Typography.bodySmall,
        color: Colors.textLighter,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
        marginBottom: Spacing.xxl,
    },
    browseBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        ...Shadow.small,
    },
    browseBtnText: {
        color: Colors.white,
        fontWeight: '800',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default DownloadsScreen;
