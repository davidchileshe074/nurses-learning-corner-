import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getContent } from '../services/content';
import { getSubscriptionStatus, checkSubscriptionExpiry } from '../services/subscription';
import { ContentItem } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shadow } from '../theme';
import { formatProgram, formatYear } from '../utils/formatters';

const { width } = Dimensions.get('window');

const LibraryScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [content, setContent] = useState<ContentItem[]>([]);
    const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                try {
                    const [contentData, sub] = await Promise.all([
                        getContent(user.program, user.yearOfStudy),
                        getSubscriptionStatus(user.userId)
                    ]);
                    setContent(contentData);
                    setFilteredContent(contentData);
                    setIsSubscribed(checkSubscriptionExpiry(sub));
                } catch (error) {
                    console.error('Fetch library error:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        let result = content;

        if (activeFilter !== 'All') {
            result = result.filter(item => item.type === activeFilter.toUpperCase());
        }

        if (searchQuery) {
            result = result.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredContent(result);
    }, [searchQuery, activeFilter, content]);

    const handleItemPress = (item: ContentItem) => {
        if (!isSubscribed) {
            Alert.alert(
                'Unlock this Material',
                'Subscribe to access high-quality study resources.',
                [
                    { text: 'Not Now', style: 'cancel' },
                    { text: 'Unlock Access', onPress: () => navigation.navigate('Home') },
                ]
            );
            return;
        }
        navigation.navigate('ContentDetail', { item });
    };

    const filters = ['All', 'PDF', 'Audio', 'Video'];

    const renderItem = ({ item }: { item: ContentItem }) => {
        let iconName: any = 'file-document-outline';
        let iconColor = Colors.primary;

        if (item.type === 'AUDIO') {
            iconName = 'headphones';
            iconColor = Colors.secondary;
        } else if (item.type === 'VIDEO') {
            iconName = 'play-circle-outline';
            iconColor = Colors.success;
        }

        return (
            <TouchableOpacity
                style={styles.itemCard}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${iconColor}10` }]}>
                    <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
                </View>

                <View style={styles.contentInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.metaRow}>
                        <View style={[styles.badge, { backgroundColor: `${iconColor}15` }]}>
                            <Text style={[styles.badgeText, { color: iconColor }]}>{item.type}</Text>
                        </View>
                        {!isSubscribed && (
                            <View style={styles.lockBadge}>
                                <MaterialCommunityIcons name="lock" size={12} color={Colors.textLighter} />
                                <Text style={styles.lockText}>Premium</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.actionIcon}>
                    <MaterialCommunityIcons name="arrow-right-circle-outline" size={24} color={Colors.border} />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Fetching your materials...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            <View style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.pageTitle}>Library</Text>
                            <View style={styles.programBadge}>
                                <Text style={styles.programText}>{formatProgram(user?.program!)} • Year {formatYear(user?.yearOfStudy!)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="magnify-scan" size={22} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color={Colors.textLighter} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for notes, audio, or video..."
                        placeholderTextColor={Colors.textLighter}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.filterTabs}>
                <FlatList
                    horizontal
                    data={filters}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.tab, activeFilter === item && styles.activeTab]}
                            onPress={() => setActiveFilter(item)}
                            activeOpacity={0.8}
                        >
                            {activeFilter === item && (
                                <MaterialCommunityIcons
                                    name={item === 'All' ? 'apps' : item === 'PDF' ? 'file-document' : item === 'Audio' ? 'music-note' : 'play-circle'}
                                    size={14}
                                    color={Colors.white}
                                    style={{ marginRight: 6 }}
                                />
                            )}
                            <Text style={[styles.tabText, activeFilter === item && styles.activeTabText]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
                />
            </View>

            <FlatList
                data={filteredContent}
                renderItem={renderItem}
                keyExtractor={(item) => item.$id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<View style={{ height: Spacing.sm }} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <LinearGradient
                            colors={['#f1f5f9', '#e2e8f0']}
                            style={styles.emptyIconCircle}
                        >
                            <MaterialCommunityIcons name="bookshelf" size={48} color={Colors.border} />
                        </LinearGradient>
                        <Text style={styles.emptyText}>No materials found</Text>
                        <Text style={styles.emptySubText}>Try adjusting your search filters or check back later.</Text>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: Spacing.md,
        color: Colors.textLight,
        fontSize: 14,
        fontWeight: '600',
    },
    header: {
        backgroundColor: Colors.white,
        paddingBottom: Spacing.md,
        ...Shadow.small,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    headerTop: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pageTitle: {
        ...Typography.h1,
        color: Colors.text,
        fontWeight: '900',
    },
    programBadge: {
        backgroundColor: Colors.primary + '10',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    programText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.borderLight,
    },
    searchWrapper: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 14,
        paddingHorizontal: Spacing.md,
        height: 52,
        borderWidth: 1.5,
        borderColor: Colors.borderLight,
        ...Shadow.small,
    },
    searchIcon: {
        marginRight: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500',
    },
    filterTabs: {
        marginBottom: Spacing.sm,
        height: 40,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: Colors.white,
        marginRight: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.borderLight,
    },
    activeTab: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        ...Shadow.small,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textLight,
    },
    activeTabText: {
        color: Colors.white,
    },
    list: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    itemCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
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
    contentInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 2,
    },
    itemDesc: {
        fontSize: 13,
        color: Colors.textLight,
        marginBottom: 6,
        lineHeight: 18,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginRight: Spacing.sm,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 6,
    },
    lockText: {
        fontSize: 10,
        color: Colors.textLighter,
        marginLeft: 4,
        fontWeight: '700',
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
        width: 100,
        height: 100,
        borderRadius: 50,
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
    },
});

export default LibraryScreen;


