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
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getContent } from '../services/content';
import { getSubscriptionStatus, checkSubscriptionExpiry } from '../services/subscription';
import { ContentItem } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatProgram, formatYear } from '../utils/formatters';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const LibraryScreen = ({ route }: any) => {
    const navigation = useNavigation<any>();
    const { subject: initialSubject } = route?.params || {};
    const { user } = useAuth();

    // -- State --
    const [allContent, setAllContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSubject, setActiveSubject] = useState<string | null>(initialSubject || null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [showAll, setShowAll] = useState(false);

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
            'First Aid & Emergency'
        ];

        const derived = new Set(allContent.map(item => item.subject).filter(Boolean));

        // Merge standard courses with any others found in the data, ensuring unique list
        const unique = new Set([...STANDARD_COURSES, ...Array.from(derived) as string[]]);

        // Sort alphabetically
        return Array.from(unique).sort();
    }, [allContent]);

    const filteredContent = useMemo(() => {
        return allContent.filter(item => {
            // Filter by Subject (Course)
            if (activeSubject && item.subject !== activeSubject) return false;

            // Filter by Type
            if (activeFilter !== 'All') {
                const typeMap: Record<string, string> = {
                    'PDF': 'PDF',
                    'Audio': 'AUDIO',
                    'Past Paper': 'PAST_PAPER',
                    'Marking Key': 'MARKING_KEY'
                };
                if (item.type !== typeMap[activeFilter]) return false;
            }

            // Filter by Search Query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    item.title.toLowerCase().includes(query) ||
                    (item.description && item.description.toLowerCase().includes(query)) ||
                    (item.subject && item.subject.toLowerCase().includes(query))
                );
            }

            return true;
        });
    }, [allContent, activeSubject, activeFilter, searchQuery]);

    // -- Data Fetching --
    const loadLibraryData = useCallback(async (isInitial = false) => {
        if (!user) return;

        if (isInitial) setLoading(true);
        else setRefreshing(true);

        try {
            // 1. Check subscription
            const status = await getSubscriptionStatus(user.userId);
            const subscribed = checkSubscriptionExpiry(status);
            setIsSubscribed(subscribed);

            // 2. Fetch Content (Fetch all relevant for the program/year to allow local filtering)
            // This prevents the "break" when clicking tabs because we filter locally
            const contentData = await getContent(
                (showAll && subscribed) ? undefined : user.program,
                (showAll && subscribed) ? undefined : user.yearOfStudy,
                undefined, // Load all subjects
                undefined  // Load all types
            );

            setAllContent(contentData);
        } catch (error) {
            console.error('[Library] Load Error:', error);
            Alert.alert('Connection Error', 'Could not refresh the library. Please check your internet.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, showAll]);

    // -- Effects --
    useEffect(() => {
        loadLibraryData(true);
    }, [showAll, user?.program, user?.yearOfStudy]); // Re-fetch only if fundamental context changes

    useEffect(() => {
        if (initialSubject) setActiveSubject(initialSubject);
    }, [initialSubject]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadLibraryData();
        });
        return unsubscribe;
    }, [navigation, loadLibraryData]);

    // -- Handlers --
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

    // -- Render Helpers --
    const filterOptions = ['All', 'PDF', 'Audio', 'Past Paper', 'Marking Key'];

    const renderHeader = () => (
        <View className="bg-white border-b border-slate-100 shadow-sm">
            <SafeAreaView edges={['top']} className="px-6 pt-2 pb-4">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-3xl font-black text-slate-900 tracking-tighter">Study Library</Text>
                        <View className="flex-row items-center mt-1">
                            <View className="bg-brand-surface px-2 py-0.5 rounded-md border border-brand-light/10 mr-2">
                                <Text className="text-[10px] font-black text-brand uppercase tracking-widest">
                                    {user?.program ? formatProgram(user.program) : 'Loading...'}
                                </Text>
                            </View>
                            <View className="bg-accent/5 px-2 py-0.5 rounded-md border border-accent/10">
                                <Text className="text-[10px] font-black text-accent uppercase tracking-widest">
                                    {user?.yearOfStudy ? formatYear(user.yearOfStudy) : ''}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Extended Discovery Toggle */}
                {isSubscribed && (
                    <TouchableOpacity
                        onPress={() => setShowAll(!showAll)}
                        className={`mb-6 p-4 rounded-2xl flex-row items-center justify-between ${showAll ? 'bg-blue-600' : 'bg-slate-50 border border-slate-200'}`}
                    >
                        <View className="flex-row items-center">
                            <MaterialCommunityIcons
                                name={showAll ? "earth" : "earth-off"}
                                size={20}
                                color={showAll ? "white" : "#64748B"}
                            />
                            <View className="ml-3">
                                <Text className={`font-bold text-sm ${showAll ? 'text-white' : 'text-slate-900'}`}>
                                    {showAll ? 'Showing All Programs' : 'My Program Only'}
                                </Text>
                                <Text className={`text-[10px] ${showAll ? 'text-blue-100' : 'text-slate-500'}`}>
                                    {showAll ? 'Exploring materials from all nursing levels' : 'Currently optimized for your curriculum'}
                                </Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons
                            name={showAll ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                            size={24}
                            color={showAll ? "white" : "#CBD5E1"}
                        />
                    </TouchableOpacity>
                )}

                {/* Search Bar */}
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 mb-4">
                    <MaterialCommunityIcons name="magnify" size={22} color="#94A3B8" />
                    <TextInput
                        className="flex-1 ml-3 text-slate-900 font-medium text-base"
                        placeholder="Search topics, courses, or papers..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={20} color="#CBD5E1" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Course (Subject) Selector */}
                {courses.length > 0 && (
                    <View className="mt-2">
                        <FlatList
                            horizontal
                            data={['All Courses', ...courses]}
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => setActiveSubject(item === 'All Courses' ? null : item)}
                                    className={`px-5 py-2.5 rounded-xl mr-2 border ${(activeSubject === item || (item === 'All Courses' && !activeSubject))
                                        ? 'bg-blue-600 border-blue-600 shadow-sm'
                                        : 'bg-white border-slate-200'
                                        }`}
                                >
                                    <Text className={`font-bold text-xs ${(activeSubject === item || (item === 'All Courses' && !activeSubject))
                                        ? 'text-white'
                                        : 'text-slate-600'
                                        }`}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}
            </SafeAreaView>

            {/* Type Filters */}
            <View className="py-4 bg-white border-t border-slate-50">
                <FlatList
                    horizontal
                    data={filterOptions}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setActiveFilter(item)}
                            className={`flex-row items-center px-6 py-2 rounded-full mr-2 border ${activeFilter === item
                                ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-200'
                                : 'bg-white border-slate-200'
                                }`}
                        >
                            <Text className={`font-bold text-xs ${activeFilter === item ? 'text-white' : 'text-slate-600'}`}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: ContentItem }) => {
        let icon: any = 'file-document-outline';
        let color = '#2563EB'; // brand (Blue)

        if (item.type === 'AUDIO') {
            icon = 'headphones';
            color = '#4F46E5'; // indigo-600
        } else if (item.type === 'MARKING_KEY') {
            icon = 'check-decagram-outline';
            color = '#0284C7'; // sky-600
        } else if (item.type === 'PAST_PAPER') {
            icon = 'file-question-outline';
            color = '#0891B2'; // cyan-600
        }

        return (
            <TouchableOpacity
                className="bg-white p-5 rounded-[24px] mb-4 flex-row items-center shadow-sm border border-slate-100"
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
            >
                <View
                    className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${color}10` }}
                >
                    <MaterialCommunityIcons name={icon} size={30} color={color} />
                </View>

                <View className="flex-1">
                    <Text className="text-slate-900 font-black text-base mb-1" numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text className="text-slate-500 text-xs mb-3 font-medium leading-4" numberOfLines={2}>
                        {item.description || 'No description available for this resource.'}
                    </Text>
                    <View className="flex-row items-center">
                        <View className="px-2 py-0.5 rounded-md mr-2" style={{ backgroundColor: `${color}15` }}>
                            <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: color }}>
                                {item.type.replace('_', ' ')}
                            </Text>
                        </View>
                        {!isSubscribed && (
                            <View className="flex-row items-center bg-slate-100 px-2 py-0.5 rounded-md">
                                <MaterialCommunityIcons name="lock" size={10} color="#94A3B8" />
                                <Text className="text-[10px] text-slate-400 ml-1 font-bold uppercase">Premium</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="ml-2 opacity-20">
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#0F172A" />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="mt-6 text-slate-400 font-bold tracking-[3px] text-[10px] uppercase">Curating Library</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />

            <FlatList
                data={filteredContent}
                renderItem={renderItem}
                keyExtractor={(item) => item.$id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View className="items-center mt-20 px-10">
                        <View className="w-32 h-32 bg-white rounded-full items-center justify-center mb-8 shadow-sm border border-slate-100">
                            <MaterialCommunityIcons name="flask-empty-outline" size={60} color="#CBD5E1" />
                        </View>
                        <Text className="text-2xl font-black text-slate-900 text-center mb-3">No Results Found</Text>
                        <Text className="text-slate-500 text-center font-medium leading-6">
                            We couldn't find any resources matching your current filters or search query.
                        </Text>
                    </View>
                }
                refreshing={refreshing}
                onRefresh={loadLibraryData}
            />
        </View>
    );
};

export default LibraryScreen;
