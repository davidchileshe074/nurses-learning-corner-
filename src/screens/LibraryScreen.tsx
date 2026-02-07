import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    useColorScheme,
    Modal,
    Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getContent } from '../services/content';
import { getSubscriptionStatus, checkSubscriptionExpiry } from '../services/subscription';
import { getLocalDownloads } from '../services/downloads';
import { ContentItem } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatProgram, formatYear } from '../utils/formatters';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';
import LoadingView from '../components/LoadingView';

const LibraryScreen = ({ route, navigation: navProp }: any) => {
    let navigation: any;
    try {
        navigation = useNavigation<any>();
    } catch (error) {
        console.warn('[Library] useNavigation failed, using prop:', error);
        navigation = navProp;
    }

    const { subject: initialSubject } = route?.params || {};
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const isMountedRef = useRef(true);


    useEffect(() => {
        console.log('[LibraryScreen] Mounted');
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // -- State --
    const [allContent, setAllContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [activeSubject, setActiveSubject] = useState<string | null>(initialSubject || null);
    const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Downloads', 'PDF'...
    const [showAll, setShowAll] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const LIMIT = 10;

    // Standard nursing curriculum courses
    const COURSES = [
        'Anatomy & Physiology',
        'Fundamentals of Nursing',
        'Pharmacology',
        'Medical-Surgical Nursing',
        'Pediatric Nursing',
        'Midwifery & Obstetrics',
        'Community Health Nursing',
        'Mental Health Nursing',
        'Microbiology',
        'Psychology & Sociology',
        'Nutrition & Dietetics',
        'Nursing Research',
        'Leadership & Management',
        'First Aid & Emergency',
        'Nursing Care Plan'
    ];

    // -- Data Fetching --
    const loadLibraryData = useCallback(async (isInitial = false, isRefresh = false, currentOffset = 0) => {
        if (!user || !isMountedRef.current) return;

        if (isInitial) setLoading(true);
        else if (isRefresh) setRefreshing(true);
        else setLoadingMore(true);

        try {
            // 1. Check subscription (only on initial/refresh)
            if (isInitial || isRefresh) {
                const status = await getSubscriptionStatus(user.userId);
                if (!isMountedRef.current) return;
                const subscribed = checkSubscriptionExpiry(status);
                setIsSubscribed(subscribed);
            }

            if (!isMountedRef.current) return;

            let newDocuments: ContentItem[] = [];
            let totalCount = 0;

            if (activeFilter === 'Downloads') {
                // Fetch Offline/Downloaded Content
                const downloads = await getLocalDownloads();
                if (!isMountedRef.current) return;

                // Map and Filter Downloads
                newDocuments = downloads
                    .filter(d => {
                        // If a subject is selected, only show downloads for that subject
                        if (activeSubject && d.subject !== activeSubject) return false;
                        return true;
                    })
                    .map(d => ({
                        $id: d.id,
                        title: d.title,
                        description: 'Offline study material',
                        type: d.type as any,
                        yearOfStudy: d.yearOfStudy as any || 'YEAR1',
                        program: d.program as any || 'G-NURSING',
                        subject: d.subject || 'General Nursing',
                        storageFileId: d.id,
                    }));
                totalCount = newDocuments.length;
                if (isMountedRef.current) setHasMore(false);
            } else {
                // Fetch Online Content
                const isNursingCarePlan = activeSubject === 'Nursing Care Plan';
                const { documents, total } = await getContent(
                    (showAll && isSubscribed) || isNursingCarePlan ? undefined : user.program,
                    (showAll && isSubscribed) || isNursingCarePlan ? undefined : user.yearOfStudy,
                    activeSubject || undefined,
                    activeFilter,
                    currentOffset,
                    LIMIT
                );
                if (!isMountedRef.current) return;
                newDocuments = documents;
                totalCount = total;
                setHasMore(currentOffset + documents.length < total);
            }

            if (isMountedRef.current) {
                if (isInitial || isRefresh) {
                    setAllContent(newDocuments);
                } else {
                    setAllContent(prev => [...prev, ...newDocuments]);
                }
                setOffset(currentOffset + newDocuments.length);
            }

        } catch (error) {
            console.warn('[Library] Load Error:', error);
            if (isMountedRef.current) {
                Alert.alert('Fetch Error', 'Could not load library content.');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
                setRefreshing(false);
                setLoadingMore(false);
            }
        }
    }, [user, showAll, isSubscribed, activeSubject, activeFilter]);

    // -- Effects --
    useEffect(() => {
        setOffset(0);
        setHasMore(true);
        setAllContent([]);
        loadLibraryData(true, false, 0);
    }, [showAll, user?.program, user?.yearOfStudy, activeSubject, activeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (initialSubject) setActiveSubject(initialSubject);
    }, [initialSubject]);

    // -- Handlers --
    const handleRefresh = useCallback(() => {
        setOffset(0);
        setHasMore(true);
        loadLibraryData(false, true, 0);
    }, [loadLibraryData]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading && !refreshing && activeFilter !== 'Downloads') {
            loadLibraryData(false, false, offset);
        }
    }, [loadingMore, hasMore, loading, refreshing, activeFilter, loadLibraryData, offset]);


    const handleSelectCourse = useCallback((course: string) => {
        setSearchQuery('');
        setActiveSubject(course === 'All Courses' ? null : course);
        setShowCourseModal(false);
    }, []);

    const handleItemPress = useCallback((item: ContentItem) => {
        if (!isSubscribed) {
            Alert.alert(
                'Premium Resource',
                'This material is only available for active subscribers.',
                [
                    { text: 'Wait', style: 'cancel' },
                    { text: 'Get Access', onPress: () => navigation.navigate('Account') },
                ]
            );
            return;
        }
        navigation.navigate('ContentDetail', { item });
    }, [isSubscribed, navigation]);

    // Client-side search filtering
    const displayedContent = useMemo(() => {
        if (!debouncedSearchQuery) return allContent;
        const query = debouncedSearchQuery.toLowerCase();
        return allContent.filter(item =>
            item.title.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            (item.subject && item.subject.toLowerCase().includes(query))
        );
    }, [allContent, debouncedSearchQuery]);


    // -- Suggestions Logic --
    const suggestions = useMemo(() => {
        if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) return [];
        const query = debouncedSearchQuery.toLowerCase();

        // Find matching subjects (courses)
        const matchingCourses = COURSES.filter(c => c.toLowerCase().includes(query)).map(c => ({ type: 'subject', label: c, id: `subj-${c}` }));

        // Find matching content titles
        const matchingTitles = allContent
            .filter(item => item.title.toLowerCase().includes(query))
            .slice(0, 5) // Limit to 5 results
            .map(item => ({ type: 'content', label: item.title, id: `cont-${item.$id}`, item }));

        return [...matchingCourses, ...matchingTitles];
    }, [debouncedSearchQuery, allContent]);


    // -- Render Helpers --
    const getIconForType = (type: string) => {
        switch (type) {
            case 'PDF': return 'file-pdf-box';
            case 'VIDEO': return 'play-box-outline';
            case 'AUDIO': return 'headphones';
            case 'IMAGE': return 'image-outline';
            case 'LINK': return 'link-variant';
            default: return 'file-document-outline';
        }
    };

    const renderItem = useCallback(({ item, index }: { item: ContentItem, index: number }) => {
        return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(12)}>
                <TouchableOpacity
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                    style={{
                        backgroundColor: Colors.white,
                        marginHorizontal: Spacing.md,
                        marginBottom: Spacing.sm,
                        padding: Spacing.md,
                        borderRadius: BorderRadius.md,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        ...Shadow.small
                    }}
                >
                    {/* Icon Container */}
                    <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: BorderRadius.sm,
                        backgroundColor: Colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: Spacing.md
                    }}>
                        <MaterialCommunityIcons
                            name={getIconForType(item.type)}
                            size={20}
                            color={Colors.primary}
                        />
                    </View>

                    {/* Content Info */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...Typography.body, fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Text style={Typography.caption}>{item.subject || 'General'}</Text>
                            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.border, marginHorizontal: 8 }} />
                            <Text style={{ ...Typography.caption, color: Colors.primary }}>{item.type?.replace('_', ' ') || 'MATERIAL'}</Text>
                        </View>
                    </View>

                    <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                </TouchableOpacity>
            </Animated.View>
        );
    }, [handleItemPress]);

    const filterOptions = ['All', 'Downloads', 'PDF', 'Audio', 'Past Paper', 'Marking Key', 'Others'];

    const renderFooter = useCallback(() => {
        if (!loadingMore) return <View className="h-20" />;
        return <LoadingView fullScreen={false} size="small" message="Loading more..." />;
    }, [loadingMore]);

    if (loading) {
        return <LoadingView message="Opening Library..." />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar style="light" backgroundColor={Colors.primaryDark} />

            {/* DHIS2 Standard Toolbar */}
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
                        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }}>Library</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowCourseModal(true)}>
                        <MaterialCommunityIcons name="filter-variant" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        height: 40,
                        borderRadius: BorderRadius.sm,
                        paddingHorizontal: Spacing.sm
                    }}>
                        <MaterialCommunityIcons name="magnify" size={20} color={Colors.white} />
                        <TextInput
                            style={{ flex: 1, marginLeft: Spacing.sm, color: Colors.white, fontSize: 14 }}
                            placeholder="Search library..."
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <MaterialCommunityIcons name="close-circle" size={18} color={Colors.white} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* Filter Pills */}
            <View style={{
                backgroundColor: Colors.white,
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
                paddingVertical: Spacing.sm
            }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: Spacing.md }}
                >
                    {filterOptions.map((item) => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => setActiveFilter(item)}
                            style={{
                                paddingHorizontal: Spacing.md,
                                paddingVertical: 6,
                                borderRadius: BorderRadius.full,
                                backgroundColor: activeFilter === item ? Colors.primaryLight : 'transparent',
                                borderWidth: 1,
                                borderColor: activeFilter === item ? Colors.primary : Colors.border,
                                marginRight: Spacing.sm
                            }}
                        >
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: activeFilter === item ? Colors.primary : Colors.textSecondary
                            }}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={displayedContent}
                renderItem={renderItem}
                keyExtractor={(item) => item.$id}
                ListHeaderComponent={
                    <View style={{ padding: Spacing.md }}>
                        <View style={{ marginBottom: Spacing.sm }}>
                            <Text style={Typography.h2}>Learning Materials</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs, flexWrap: 'wrap', gap: Spacing.sm }}>
                                {user?.program && (
                                    <Text style={{ ...Typography.caption, fontWeight: '700', textTransform: 'uppercase' }}>
                                        {formatProgram(user.program)}
                                    </Text>
                                )}
                                {activeSubject && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full }}>
                                        <Text style={{ ...Typography.caption, color: Colors.primary, fontWeight: '700' }}>{activeSubject}</Text>
                                        <TouchableOpacity onPress={() => setActiveSubject(null)} style={{ marginLeft: 4 }}>
                                            <MaterialCommunityIcons name="close-circle" size={14} color={Colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>

                        {isSubscribed && (
                            <TouchableOpacity
                                onPress={() => setShowAll(!showAll)}
                                style={{
                                    marginTop: Spacing.md,
                                    padding: Spacing.md,
                                    backgroundColor: showAll ? Colors.primary : Colors.white,
                                    borderWidth: 1,
                                    borderColor: showAll ? Colors.primary : Colors.border,
                                    borderRadius: BorderRadius.md,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons
                                        name={showAll ? "earth" : "school"}
                                        size={20}
                                        color={showAll ? Colors.white : Colors.primary}
                                    />
                                    <View style={{ marginLeft: Spacing.md }}>
                                        <Text style={{ ...Typography.body, fontWeight: '700', color: showAll ? Colors.white : Colors.text }}>
                                            {showAll ? 'Global Discovery' : 'Curriculum Mode'}
                                        </Text>
                                        <Text style={{ ...Typography.caption, color: showAll ? 'rgba(255,255,255,0.7)' : Colors.textMuted }}>
                                            {showAll ? 'All nursing programs' : `${formatProgram(user?.program)}`}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{
                                    width: 32,
                                    height: 16,
                                    borderRadius: 8,
                                    backgroundColor: showAll ? 'rgba(255,255,255,0.3)' : Colors.borderLight,
                                    justifyContent: 'center',
                                    paddingHorizontal: 2
                                }}>
                                    <View style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: Colors.white,
                                        alignSelf: showAll ? 'flex-end' : 'flex-start'
                                    }} />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: Spacing.xxxl, paddingHorizontal: Spacing.xxxl }}>
                        <MaterialCommunityIcons name="folder-search-outline" size={64} color={Colors.border} />
                        <Text style={{ ...Typography.h2, textAlign: 'center', marginTop: Spacing.md }}>No Resources Found</Text>
                        <Text style={{ ...Typography.body, textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.sm }}>
                            Try adjusting your filters or search.
                        </Text>
                    </View>
                }
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />

            {/* Course Modal */}
            <Modal visible={showCourseModal} transparent={true} animationType="fade">
                <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg }} onPress={() => setShowCourseModal(false)}>
                    <View style={{ backgroundColor: Colors.white, borderRadius: BorderRadius.md, overflow: 'hidden' }}>
                        <View style={{ padding: Spacing.md, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: Colors.white, fontWeight: '700' }}>Select Course</Text>
                            <TouchableOpacity onPress={() => setShowCourseModal(false)}>
                                <MaterialCommunityIcons name="close" size={20} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: '70%' }}>
                            <TouchableOpacity
                                onPress={() => handleSelectCourse('All Courses')}
                                style={{ padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, flexDirection: 'row', justifyContent: 'space-between' }}
                            >
                                <Text style={{ color: !activeSubject ? Colors.primary : Colors.text, fontWeight: !activeSubject ? '700' : '400' }}>All Courses</Text>
                                {!activeSubject && <MaterialCommunityIcons name="check" size={20} color={Colors.primary} />}
                            </TouchableOpacity>
                            {COURSES.map((course) => (
                                <TouchableOpacity
                                    key={course}
                                    onPress={() => handleSelectCourse(course)}
                                    style={{ padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, flexDirection: 'row', justifyContent: 'space-between' }}
                                >
                                    <Text style={{ color: activeSubject === course ? Colors.primary : Colors.text, fontWeight: activeSubject === course ? '700' : '400' }}>{course}</Text>
                                    {activeSubject === course && <MaterialCommunityIcons name="check" size={20} color={Colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

export default LibraryScreen;

