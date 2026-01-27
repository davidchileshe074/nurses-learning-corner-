import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    StatusBar,
    Animated,
    Dimensions,
    ScrollView,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getContent } from '../services/content';
import { getSubscriptionStatus, checkSubscriptionExpiry } from '../services/subscription';
import { getLocalDownloads } from '../services/downloads';
import { ContentItem } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatProgram, formatYear } from '../utils/formatters';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'react-native';

const LibraryScreen = ({ route }: any) => {
    const { subject: initialSubject } = route?.params || {};
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // -- State --
    const [allContent, setAllContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSubject, setActiveSubject] = useState<string | null>(initialSubject || null);
    const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Downloads', 'PDF'...
    const [showAll, setShowAll] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 10;

    // -- Derived Data --
    const courses = useMemo(() => {
        // Standard nursing curriculum courses - Hardcoded as requested
        const STANDARD_COURSES = [
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

        const derived = new Set(allContent.map(item => item.subject).filter(Boolean));
        // Merge standard courses with any others found in the data, ensuring unique list
        const unique = new Set([...STANDARD_COURSES, ...Array.from(derived) as string[]]);
        return Array.from(unique).sort();
    }, [allContent]);

    // -- Data Fetching --
    const loadLibraryData = useCallback(async (isInitial = false, isRefresh = false, currentOffset = 0) => {
        if (!user) return;

        if (isInitial) setLoading(true);
        else if (isRefresh) setRefreshing(true);
        else setLoadingMore(true);

        try {
            // 1. Check subscription (only on initial/refresh)
            if (isInitial || isRefresh) {
                const status = await getSubscriptionStatus(user.userId);
                const subscribed = checkSubscriptionExpiry(status);
                setIsSubscribed(subscribed);
            }

            let newDocuments: ContentItem[] = [];
            let totalCount = 0;

            if (activeFilter === 'Downloads') {
                // Fetch Offline/Downloaded Content
                const downloads = await getLocalDownloads();
                // Map DownloadMetadata to ContentItem
                newDocuments = downloads.map(d => ({
                    $id: d.id,
                    title: d.title,
                    description: 'Downloaded content available offline', // Metadata doesn't store full desc yet
                    type: d.type as any,
                    yearOfStudy: 'YEAR1', // Fallback
                    program: 'REGISTERED-NURSING', // Fallback
                    subject: 'Offline', // Fallback
                    storageFileId: d.id, // using id as file ref
                }));
                totalCount = newDocuments.length;
                setHasMore(false); // No pagination for local downloads
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
                newDocuments = documents;
                totalCount = total;
                setHasMore(currentOffset + documents.length < total);
            }

            if (isInitial || isRefresh) {
                setAllContent(newDocuments);
            } else {
                setAllContent(prev => [...prev, ...newDocuments]);
            }

            setOffset(currentOffset + newDocuments.length);

        } catch (error) {
            console.warn('[Library] Load Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Fetch Error',
                text2: 'Could not load library content.'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [user, showAll, isSubscribed, activeSubject, activeFilter]);

    // -- Effects --
    useEffect(() => {
        loadLibraryData(true, false, 0);
    }, [showAll, user?.program, user?.yearOfStudy, activeSubject, activeFilter]);

    useEffect(() => {
        if (initialSubject) setActiveSubject(initialSubject);
    }, [initialSubject]);

    // -- Handlers --
    const handleRefresh = () => {
        setOffset(0);
        setHasMore(true);
        loadLibraryData(false, true, 0);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore && !loading && !refreshing && activeFilter !== 'Downloads') {
            loadLibraryData(false, false, offset);
        }
    };

    const handleItemPress = (item: ContentItem) => {
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
    };

    // Client-side search filtering
    const displayedContent = useMemo(() => {
        if (!searchQuery) return allContent;
        const query = searchQuery.toLowerCase();
        return allContent.filter(item =>
            item.title.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            (item.subject && item.subject.toLowerCase().includes(query))
        );
    }, [allContent, searchQuery]);


    // -- Suggestions Logic --
    const suggestions = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return [];
        const query = searchQuery.toLowerCase();

        // Find matching subjects (courses)
        const matchingCourses = courses.filter(c => c.toLowerCase().includes(query)).map(c => ({ type: 'subject', label: c, id: `subj-${c}` }));

        // Find matching content titles
        const matchingTitles = allContent
            .filter(item => item.title.toLowerCase().includes(query))
            .slice(0, 5) // Limit to 5 results
            .map(item => ({ type: 'content', label: item.title, id: `cont-${item.$id}`, item }));

        return [...matchingCourses, ...matchingTitles];
    }, [searchQuery, courses, allContent]);

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
        return (
            <TouchableOpacity
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
                className="bg-white dark:bg-slate-900 mx-6 mb-4 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex-row items-center"
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
                        <View className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md mr-2">
                            <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400" numberOfLines={1}>
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

    const filterOptions = ['All', 'Downloads', 'PDF', 'Audio', 'Past Paper', 'Marking Key'];

    const renderHeader = useCallback(() => (
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

            {/* Extended Discovery Toggle - Premium Switch style */}
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
                            <Text className={`text-[10px] font-medium leading-tight ${showAll ? 'text-blue-100' : 'text-slate-500 dark:text-slate-500'}`}>
                                {showAll ? 'Exploring resources from all nursing programs' : `Showing ${formatProgram(user?.program)} content`}
                            </Text>
                        </View>
                    </View>
                    <View className={`w-12 h-6 rounded-full px-1 justify-center ${showAll ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-800'}`}>
                        <Animated.View
                            className={`w-4 h-4 rounded-full bg-white shadow-sm ${showAll ? 'self-end' : 'self-start'}`}
                        />
                    </View>
                </TouchableOpacity>
            )}
        </View>
    ), [user, isSubscribed, showAll, isDark]);

    // -- Sticky Header Content (Fixed at top) --
    // We render this directly in the main return to ensure stable context
    const renderStickySearch = () => (
        <View className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm z-50">
            <SafeAreaView edges={['top']} className="px-6 pt-2">
                <View className="relative z-50">
                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-4 h-14 shadow-sm">
                        <MaterialCommunityIcons name="magnify" size={22} color={isDark ? "#60A5FA" : "#2563EB"} />
                        <TextInput
                            className="flex-1 ml-3 text-slate-900 dark:text-white font-bold text-base"
                            placeholder={activeFilter === 'Downloads' ? "Search downloads..." : "Search topics..."}
                            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
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

                    {/* Suggestions Dropdown (Positioned exactly below the search bar) */}
                    {searchQuery.length > 1 && suggestions.length > 0 && (
                        <View className="absolute top-[62px] left-0 right-0 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 z-[100] overflow-hidden">
                            <View className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quick Results</Text>
                                <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                    <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400">{suggestions.length}</Text>
                                </View>
                            </View>
                            <ScrollView
                                style={{ maxHeight: 350 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {suggestions.map((suggestion: any, index) => (
                                    <TouchableOpacity
                                        key={suggestion.id}
                                        className={`px-5 py-4 flex-row items-center ${index < suggestions.length - 1 ? 'border-b border-slate-50 dark:border-slate-800/50' : ''
                                            }`}
                                        onPress={() => {
                                            if (suggestion.type === 'subject') {
                                                setActiveSubject(suggestion.label);
                                                setSearchQuery('');
                                            } else if (suggestion.type === 'content') {
                                                handleItemPress(suggestion.item);
                                            }
                                        }}
                                    >
                                        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${suggestion.type === 'subject'
                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                            : 'bg-slate-50 dark:bg-slate-800'
                                            }`}>
                                            <MaterialCommunityIcons
                                                name={suggestion.type === 'subject' ? 'bookshelf' : getIconForType(suggestion.item?.type)}
                                                size={20}
                                                color={suggestion.type === 'subject' ? '#2563EB' : (isDark ? '#94A3B8' : '#64748B')}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                                                {suggestion.label}
                                            </Text>
                                            <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                                                {suggestion.type === 'subject' ? 'Course Focus' : `${suggestion.item?.type?.replace('_', ' ') || 'Resource'}`}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons
                                            name="arrow-up-left"
                                            size={18}
                                            color={isDark ? '#475569' : '#CBD5E1'}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Sub-Filters area (Only shown when NOT searching) */}
                {!searchQuery && (
                    <View className="mt-3 pb-3">
                        {/* Active Indicators */}
                        {(activeSubject || activeFilter !== 'All') && (
                            <View className="flex-row items-center mb-3 px-1">
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Using:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                    {activeSubject && (
                                        <View className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800/50 mr-2 flex-row items-center">
                                            <Text className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mr-1">{activeSubject}</Text>
                                            <TouchableOpacity onPress={() => setActiveSubject(null)}>
                                                <MaterialCommunityIcons name="close" size={10} color="#2563EB" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    {activeFilter !== 'All' && (
                                        <View className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 mr-2 flex-row items-center">
                                            <Text className="text-[9px] font-bold text-slate-600 dark:text-slate-400 mr-1">{activeFilter}</Text>
                                            <TouchableOpacity onPress={() => setActiveFilter('All')}>
                                                <MaterialCommunityIcons name="close" size={10} color="#475569" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        )}

                        {/* Quick Selection Lists */}
                        {courses.length > 0 && activeFilter !== 'Downloads' && (
                            <FlatList
                                horizontal
                                data={['All Courses', ...courses]}
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item}
                                contentContainerStyle={{ paddingRight: 24 }}
                                className="mb-3"
                                renderItem={({ item }) => {
                                    const isActive = activeSubject === item || (item === 'All Courses' && !activeSubject);
                                    return (
                                        <TouchableOpacity
                                            onPress={() => setActiveSubject(item === 'All Courses' ? null : item)}
                                            className={`px-5 py-2 rounded-xl mr-2 border ${isActive
                                                ? 'bg-blue-600 border-blue-600 shadow-sm'
                                                : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                                                }`}
                                        >
                                            <Text className={`font-bold text-[11px] ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                        <FlatList
                            horizontal
                            data={filterOptions}
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item}
                            contentContainerStyle={{ paddingRight: 24 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
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
                            )}
                        />
                    </View>
                )}
            </SafeAreaView>
        </View>
    );

    const renderFooter = useCallback(() => {
        if (!loadingMore) return <View className="h-20" />;
        return (
            <View className="py-8 items-center justify-center">
                <ActivityIndicator size="large" color={isDark ? "#60A5FA" : "#2563EB"} />
            </View>
        );
    }, [loadingMore, isDark]);

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* Fixed Header Content */}
                {renderStickySearch()}

                <FlatList
                    data={displayedContent}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.$id}
                    ListHeaderComponent={renderHeader}
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View className="items-center mt-20 px-10">
                            <View className="w-32 h-32 bg-white dark:bg-slate-900 rounded-full items-center justify-center mb-8 shadow-sm border border-slate-100 dark:border-slate-800">
                                <MaterialCommunityIcons
                                    name={activeFilter === 'Downloads' ? "download-off-outline" : "flask-empty-outline"}
                                    size={60}
                                    color={isDark ? "#475569" : "#CBD5E1"}
                                />
                            </View>
                            <Text className="text-2xl font-black text-slate-900 dark:text-white text-center mb-3">
                                {activeFilter === 'Downloads' ? 'No Downloads Yet' : 'No Results Found'}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-center font-medium leading-6">
                                {activeFilter === 'Downloads'
                                    ? 'Interact with content and click download to access them offline here.'
                                    : "We couldn't find any resources matching your current filters or search query."}
                            </Text>
                        </View>
                    }
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                />
            </KeyboardAvoidingView>
        </View>
    );
};

export default LibraryScreen;
