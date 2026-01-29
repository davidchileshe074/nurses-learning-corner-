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
import { useNavigation } from '@react-navigation/native';

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

    const renderItem = useCallback(({ item }: { item: ContentItem }) => {
        // console.log('[Library] Rendering item:', item.title);
        return (
            <TouchableOpacity
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
                className="bg-white dark:bg-slate-800 mx-6 mb-4 p-5 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-sm flex-row items-center"
            >
                {/* Icon Container with subtle gradient intent */}
                <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-5 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-blue-50 border border-blue-100'
                    }`}>
                    <MaterialCommunityIcons
                        name={getIconForType(item.type)}
                        size={28}
                        color={isDark ? '#60A5FA' : '#2563EB'}
                    />
                </View>

                {/* Content Info */}
                <View className="flex-1 pr-2">
                    <Text
                        className="text-slate-900 dark:text-white font-black text-base mb-1.5 leading-tight"
                        numberOfLines={2}
                    >
                        {item.title}
                    </Text>
                    <View className="flex-row items-center flex-wrap">
                        <View className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md mr-2">
                            <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-200" numberOfLines={1}>
                                {item.subject || 'General Nursing'}
                            </Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-1.5" />
                            <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                                {item.type?.replace('_', ' ') || 'MATERIAL'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Visual Cue */}
                <View className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-full border border-slate-100 dark:border-slate-800">
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={18}
                        color={isDark ? '#64748B' : '#94A3B8'}
                    />
                </View>
            </TouchableOpacity>
        );
    }, [isDark, handleItemPress]);

    const filterOptions = ['All', 'Downloads', 'PDF', 'Audio', 'Past Paper', 'Marking Key', 'Others'];

    const renderFooter = useCallback(() => {
        if (!loadingMore) return <View className="h-20" />;
        return (
            <View className="py-8 items-center justify-center">
                <ActivityIndicator size="large" color={isDark ? "#60A5FA" : "#2563EB"} />
            </View>
        );
    }, [loadingMore, isDark]);

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <StatusBar style={isDark ? "light" : "dark"} />

            {/* Fixed Header Content - Inlined for stability */}
            <View className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50 shadow-sm z-50">
                <View style={{ paddingTop: insets.top }} className="px-6 pb-2">
                    <View className="relative z-50 mt-2">
                        <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-4 h-14 shadow-sm">
                            <MaterialCommunityIcons name="magnify" size={22} color={isDark ? "#60A5FA" : "#2563EB"} />
                            <TextInput
                                className="flex-1 ml-3 text-slate-900 dark:text-white font-bold text-base"
                                placeholder={activeFilter === 'Downloads' ? "Search downloads..." : "Search topics..."}
                                placeholderTextColor={isDark ? "#94A3B8" : "#94A3B8"}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                selectionColor="#2563EB"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                                    <MaterialCommunityIcons name="close-circle" size={20} color={isDark ? "#475569" : "#CBD5E1"} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Suggestions Dropdown */}
                        {searchQuery.length > 1 && suggestions.length > 0 && (
                            <View className="absolute top-[64px] left-0 right-0 bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-700/50 z-[100] overflow-hidden">
                                <View className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 flex-row justify-between items-center bg-slate-50/30 dark:bg-slate-800/40">
                                    <Text className="text-[11px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-[2px]">Quick Results</Text>
                                    <View className="bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-full">
                                        <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400">{suggestions.length}</Text>
                                    </View>
                                </View>
                                <ScrollView
                                    style={{ maxHeight: 380 }}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                >
                                    {suggestions.map((suggestion: any) => (
                                        <TouchableOpacity
                                            key={suggestion.id}
                                            className="px-6 py-4 flex-row items-center border-b border-slate-50 dark:border-slate-800/30"
                                            onPress={() => {
                                                if (suggestion.type === 'subject') {
                                                    setActiveSubject(suggestion.label);
                                                    setSearchQuery('');
                                                } else if (suggestion.type === 'content') {
                                                    handleItemPress(suggestion.item);
                                                }
                                            }}
                                        >
                                            <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-4 ${suggestion.type === 'subject'
                                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                                : 'bg-slate-50 dark:bg-slate-800'
                                                }`}>
                                                <MaterialCommunityIcons
                                                    name={suggestion.type === 'subject' ? 'bookmark-outline' : getIconForType(suggestion.item?.type)}
                                                    size={22}
                                                    color={suggestion.type === 'subject' ? '#2563EB' : (isDark ? '#94A3B8' : '#64748B')}
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-[15px] font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                                                    {suggestion.label}
                                                </Text>
                                                <Text className="text-[11px] text-slate-500 dark:text-slate-300 font-semibold mt-0.5 uppercase tracking-wider">
                                                    {suggestion.type === 'subject' ? 'Course focus' : `${suggestion.item?.type?.replace('_', ' ') || 'Document'}`}
                                                </Text>
                                            </View>
                                            <View className="bg-slate-100 dark:bg-slate-700 w-8 h-8 rounded-full items-center justify-center">
                                                <MaterialCommunityIcons name="arrow-top-left" size={16} color={isDark ? '#CBD5E1' : '#94A3B8'} />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <View className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 flex-row items-center">
                                    <MaterialCommunityIcons name="information-outline" size={14} color={isDark ? "#94A3B8" : "#94A3B8"} />
                                    <Text className="ml-2 text-[10px] text-slate-400 dark:text-slate-300 font-medium italic">Tap result to filter or view</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Sub-Filters area */}
                    {!searchQuery && (
                        <View className="mt-4 pb-3">
                            {/* Active Indicators */}
                            {(activeSubject || activeFilter !== 'All') && (
                                <View className="flex-row items-center mb-3 px-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Using:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                        {activeSubject && (
                                            <View className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800/50 mr-2 flex-row items-center">
                                                <Text className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mr-1">{activeSubject}</Text>
                                                <TouchableOpacity
                                                    onPress={() => setActiveSubject(null)}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <MaterialCommunityIcons name="close" size={10} color="#2563EB" />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                        {activeFilter !== 'All' && (
                                            <View className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 mr-2 flex-row items-center">
                                                <Text className="text-[9px] font-bold text-slate-600 dark:text-slate-400 mr-1">{activeFilter}</Text>
                                                <TouchableOpacity
                                                    onPress={() => setActiveFilter('All')}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <MaterialCommunityIcons name="close" size={10} color="#475569" />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Course filtering via Modal */}
                            {activeFilter !== 'Downloads' && (
                                <View className="mb-3 px-1">
                                    <TouchableOpacity
                                        onPress={() => setShowCourseModal(true)}
                                        className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-2xl px-4 py-3 flex-row justify-between items-center"
                                    >
                                        <View className="flex-row items-center">
                                            <MaterialCommunityIcons name="filter-variant" size={20} color={isDark ? "#60A5FA" : "#2563EB"} />
                                            <Text className="ml-2 font-bold text-slate-800 dark:text-slate-200">
                                                {activeSubject || 'Filter by Course'}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-down" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Filter Options horizontal ScrollView */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingRight: 24 }}
                            >
                                {filterOptions.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        onPress={() => setActiveFilter(item)}
                                        className={`flex-row items-center px-6 py-1.5 rounded-full mr-2 border ${activeFilter === item
                                            ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        <Text className={`font-bold text-[11px] ${activeFilter === item ? 'text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>

            <FlatList
                data={displayedContent}
                renderItem={renderItem}
                keyExtractor={(item) => item.$id}
                ListHeaderComponent={
                    <View className="px-6 pt-6 pb-4">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Study Library</Text>
                                <View className="flex-row items-center mt-1">
                                    {user?.program && (
                                        <View className="bg-brand-surface dark:bg-brand-dark/30 px-2 py-0.5 rounded-md border border-brand-light/10 mr-2">
                                            <Text className="text-[10px] font-black text-brand dark:text-brand-light uppercase tracking-widest">
                                                {formatProgram(user.program)}
                                            </Text>
                                        </View>
                                    )}
                                    {user?.yearOfStudy && (
                                        <View className="bg-accent/5 dark:bg-accent/10 px-2 py-0.5 rounded-md border border-accent/10">
                                            <Text className="text-[10px] font-black text-accent uppercase tracking-widest">
                                                {formatYear(user.yearOfStudy)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {isSubscribed && (
                            <TouchableOpacity
                                onPress={() => setShowAll(!showAll)}
                                activeOpacity={0.8}
                                className={`mb-6 p-4 rounded-[24px] flex-row items-center justify-between border ${showAll
                                    ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'
                                    }`}
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className={`w-10 h-10 rounded-full items-center justify-center ${showAll ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/30'
                                        }`}>
                                        <MaterialCommunityIcons
                                            name={showAll ? "earth" : "school-outline"}
                                            size={20}
                                            color={showAll ? "white" : "#2563EB"}
                                        />
                                    </View>
                                    <View className="ml-4 flex-1">
                                        <Text className={`font-black text-sm ${showAll ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                            {showAll ? 'Global Discovery' : 'Curriculum Mode'}
                                        </Text>
                                        <Text className={`text-[10px] font-medium leading-tight ${showAll ? 'text-blue-100' : 'text-slate-500 dark:text-slate-300'}`}>
                                            {showAll ? 'Exploring resources from all nursing programs' : `Showing ${formatProgram(user?.program)} content`}
                                        </Text>
                                    </View>
                                </View>
                                <View className={`w-12 h-6 rounded-full px-1 justify-center ${showAll ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                    <View className={`w-4 h-4 rounded-full bg-white shadow-sm ${showAll ? 'self-end' : 'self-start'}`} />
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
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={false}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                windowSize={5}
                ListEmptyComponent={
                    <View className="items-center mt-20 px-10">
                        <View className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
                            <MaterialCommunityIcons name="folder-search-outline" size={48} color={isDark ? "#475569" : "#CBD5E1"} />
                        </View>
                        <Text className="text-xl font-black text-slate-800 dark:text-white text-center mb-2">No Resources Found</Text>
                        <Text className="text-slate-400 dark:text-slate-500 text-center font-medium px-4">
                            Try adjusting your filters or search query to find the learning material you need.
                        </Text>
                        {(activeFilter !== 'All' || activeSubject || debouncedSearchQuery) && (
                            <TouchableOpacity
                                onPress={() => { setActiveFilter('All'); setActiveSubject(null); setSearchQuery(''); }}
                                className="mt-8 bg-blue-600 px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/30"
                            >
                                <Text className="text-white font-black uppercase tracking-widest text-[11px]">Clear All Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />

            {/* Course Selection Modal */}
            <Modal
                visible={showCourseModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCourseModal(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-end"
                    onPress={() => setShowCourseModal(false)}
                >
                    <View className="bg-white dark:bg-slate-900 rounded-t-[40px] px-6 pt-8 pb-10 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-2xl font-black text-slate-900 dark:text-white">Select Course</Text>
                                <Text className="text-slate-500 dark:text-slate-300 font-medium">Filter library by subject focus</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowCourseModal(false)}
                                className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center"
                            >
                                <MaterialCommunityIcons name="close" size={20} color={isDark ? "#FFFFFF" : "#0F172A"} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="max-h-[60vh]" showsVerticalScrollIndicator={false}>
                            <TouchableOpacity
                                onPress={() => handleSelectCourse('All Courses')}
                                className={`flex-row items-center p-4 rounded-2xl mb-2 ${!activeSubject ? 'bg-blue-600' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                            >
                                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${!activeSubject ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                                    <MaterialCommunityIcons name="all-inclusive" size={20} color={!activeSubject ? '#FFFFFF' : '#2563EB'} />
                                </View>
                                <Text className={`flex-1 font-bold ${!activeSubject ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>All Courses</Text>
                                {!activeSubject && <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />}
                            </TouchableOpacity>

                            {COURSES.map((course) => {
                                const isActive = activeSubject === course;
                                return (
                                    <TouchableOpacity
                                        key={course}
                                        onPress={() => handleSelectCourse(course)}
                                        className={`flex-row items-center p-4 rounded-2xl mb-2 ${isActive ? 'bg-blue-600' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                                    >
                                        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <MaterialCommunityIcons name="book-outline" size={20} color={isActive ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B')} />
                                        </View>
                                        <Text className={`flex-1 font-bold ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{course}</Text>
                                        {isActive && <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

export default LibraryScreen;
