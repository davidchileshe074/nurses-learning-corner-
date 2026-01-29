import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    RefreshControl,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getContent } from '../services/content';
import { ContentItem, Subject } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatProgram, formatYear } from '../utils/formatters';
import { LinearGradient } from 'expo-linear-gradient';
import { getSubscriptionStatus } from '../services/subscription';
import { Subscription, AppNotification } from '../types';
import { checkAndGenerateNotifications, getNotifications } from '../services/notifications';
import { getRecentItems } from '../services/recent';
import { checkSubscriptionExpiry } from '../services/subscription';
import { removeAllDownloads } from '../services/downloads';


const { width } = Dimensions.get('window');
import * as FileSystem from 'expo-file-system/legacy';

const HOME_STATS_CACHE = `${FileSystem.cacheDirectory}home_stats_cache.json`;

const saveHomeStatsToCache = async (data: any) => {
    try {
        await FileSystem.writeAsStringAsync(HOME_STATS_CACHE, JSON.stringify(data));
    } catch (e) {
        console.warn('[HomeCache] Save Error:', e);
    }
};

const getHomeStatsFromCache = async (): Promise<any | null> => {
    try {
        const info = await FileSystem.getInfoAsync(HOME_STATS_CACHE);
        if (info.exists) {
            const content = await FileSystem.readAsStringAsync(HOME_STATS_CACHE);
            return JSON.parse(content);
        }
    } catch (e) {
        return null;
    }
};

const HomeScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [stats, setStats] = useState({ totalItems: 0, subjectsCount: 0 });
    const [hasUnread, setHasUnread] = useState(false);
    const [recentItems, setRecentItems] = useState<ContentItem[]>([]);
    const lastFetchTime = React.useRef<number>(0);
    const FETCH_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes


    const fetchData = useCallback(async (isInitial = false) => {
        if (!user) return;
        if (isInitial) setLoading(true);
        else setRefreshing(true);

        try {
            const [contentRes, subStatus] = await Promise.all([
                getContent(user.program, user.yearOfStudy, undefined, undefined, 0, 100), // Get first 100 for dashboard stats
                getSubscriptionStatus(user.userId)
            ]);

            const documents = contentRes.documents;
            const uniqueSubjects = [...new Set(documents.map(item => item.subject).filter(Boolean))] as Subject[];

            setSubjects(uniqueSubjects);
            setSubscription(subStatus);
            setStats({
                totalItems: contentRes.total,
                subjectsCount: uniqueSubjects.length
            });

            // Check for notifications
            await checkAndGenerateNotifications(user, subStatus);
            const [notifications, recent] = await Promise.all([
                getNotifications(),
                getRecentItems()
            ]);
            setHasUnread(notifications.some(n => !n.isRead));
            setRecentItems(recent);

            // SECURITY: If subscription is expired, purge all local downloads
            const isSubscribed = checkSubscriptionExpiry(subStatus);
            if (!isSubscribed) {
                console.log('[Security] Subscription expired or inactive. Purging local content.');
                await removeAllDownloads();
            }

            // Save to cache for offline availability
            saveHomeStatsToCache({
                subjects: uniqueSubjects,
                subStatus,
                stats: { totalItems: contentRes.total, subjectsCount: uniqueSubjects.length },
                recent
            });

            lastFetchTime.current = Date.now();
        } catch (error) {
            console.error('[Home] Fetch Error (checking cache):', error);
            const cached = await getHomeStatsFromCache();
            if (cached) {
                setSubjects(cached.subjects);
                setSubscription(cached.subStatus);
                setStats(cached.stats);
                setRecentItems(cached.recent);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    const handleOpenModule = async (subject: string) => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch first item of this subject
            const { documents } = await getContent(user.program, user.yearOfStudy, subject as any, 'All', 0, 1);
            if (documents.length > 0) {
                navigation.navigate('ContentDetail', { item: documents[0] });
            } else {
                navigation.navigate('Library', { subject });
            }
        } catch (error) {
            console.error('Error opening module:', error);
            navigation.navigate('Library', { subject });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(true);
    }, [user?.program, user?.yearOfStudy]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            const now = Date.now();
            if (now - lastFetchTime.current > FETCH_THROTTLE_MS) {
                fetchData();
            }
        });
        return unsubscribe;
    }, [navigation, fetchData]);


    const daysRemaining = useMemo(() => {
        if (!subscription?.endDate) return null;
        const expiryDate = new Date(subscription.endDate);
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }, [subscription]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
                <ActivityIndicator size="large" color={isDark ? "#60A5FA" : "#2563EB"} />
                <Text className="mt-8 text-blue-400/60 dark:text-blue-500/40 font-black tracking-[5px] text-[10px] uppercase">Curating Excellence</Text>
            </View>
        );
    }

    const firstName = user?.fullName?.split(' ')[0] || 'Student';

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="flex-1"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchData} colors={[isDark ? "#60A5FA" : "#2563EB"]} tintColor={isDark ? "#60A5FA" : "#2563EB"} />
                    }
                >
                    {/* Immersive Top Header */}
                    <View className="px-6 py-6 flex-row justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <View>
                            <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[3px] mb-1">{getGreeting()}</Text>
                            <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Hi, {firstName}.</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Account')}
                            className="w-12 h-12 bg-white dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700 relative rounded-2xl"
                        >
                            <MaterialCommunityIcons name="account-outline" size={24} color={isDark ? "#FFFFFF" : "#1E1B4B"} />
                            {hasUnread && (
                                <View className="absolute top-0 right-0 w-3 h-3 bg-blue-600 border-2 border-white dark:border-slate-800" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Performance Dashboard Widget */}
                    <View className="px-6 mt-8 mb-12">
                        <View className="bg-slate-900 dark:bg-slate-900 p-8 shadow-2xl shadow-slate-200 dark:shadow-none rounded-[32px] overflow-hidden border border-slate-800/50">
                            <View className="flex-row justify-between items-start mb-10">
                                <View className="flex-1 pr-4">
                                    <Text className="text-blue-400 dark:text-blue-500 font-black text-[9px] uppercase tracking-[4px] mb-3">Academic Program</Text>
                                    <Text className="text-white text-3xl font-black tracking-tighter leading-8" numberOfLines={2}>
                                        {user?.program ? formatProgram(user.program) : 'Curriculum Not Set'}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="shield-check-outline" size={28} color="rgba(255,255,255,0.2)" />
                            </View>

                            <View className="flex-row items-center border-t border-white/5 pt-8">
                                <View className="flex-1 flex-row items-center">
                                    <View className="w-10 h-10 bg-white/10 items-center justify-center mr-4 rounded-xl">
                                        <MaterialCommunityIcons name="clock-check-outline" size={20} color="white" />
                                    </View>
                                    <View>
                                        <Text className="text-slate-400 font-black text-[8px] uppercase tracking-[2px]">Status</Text>
                                        <Text className="text-white font-black text-xs uppercase tracking-tighter">
                                            {daysRemaining !== null ? `${daysRemaining} Days Access` : 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-400 font-black text-[8px] uppercase tracking-[2px]">Content Density</Text>
                                    <Text className="text-blue-400 font-black text-xs uppercase tracking-tighter">{stats.totalItems} Resources</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Recent Materials - Industry-Standard Continuation */}
                    {recentItems.length > 0 && (
                        <View className="mb-14">
                            <View className="px-6 flex-row justify-between items-end mb-6">
                                <View>
                                    <Text className="text-slate-900 dark:text-white text-2xl font-black tracking-tight">Continuation</Text>
                                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Recently Accessed</Text>
                                </View>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 24 }}
                            >

                                {recentItems.map((item) => (
                                    <TouchableOpacity
                                        key={item.$id}
                                        onPress={() => navigation.navigate('ContentDetail', { item })}
                                        className="bg-white dark:bg-slate-900 mr-4 p-5 shadow-sm border border-blue-50 dark:border-slate-800 flex-row items-center rounded-[38px]"
                                        style={{ width: width * 0.75 }}
                                    >
                                        <View className="w-12 h-12 items-center justify-center mr-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                                            <MaterialCommunityIcons
                                                name={item.type === 'AUDIO' ? 'headphones' : 'file-document-outline'}
                                                size={22}
                                                color={isDark ? "#60A5FA" : "#2563EB"}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-slate-900 dark:text-white font-bold text-[13px] mb-1" numberOfLines={1}>{item.title}</Text>
                                            <View className="flex-row items-center">
                                                <Text className="text-[8px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[2px]">{item.type.replace('_', ' ')}</Text>
                                            </View>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? "#334155" : "#BFDBFE"} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Main Study Tools - Revision Center */}
                    <View className="px-6 mb-12">
                        <View className="flex-row justify-between items-end mb-6">
                            <View>
                                <Text className="text-slate-900 dark:text-white text-2xl font-black tracking-tight">Revision Center</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Master Your Concepts</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-6">
                            <TouchableOpacity
                                onPress={() => navigation.navigate('FlashcardDecks')}
                                activeOpacity={0.9}
                                className="flex-1 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
                            >
                                <View className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl items-center justify-center mb-4">
                                    <MaterialCommunityIcons name="cards-variant" size={26} color={isDark ? "#60A5FA" : "#2563EB"} />
                                </View>
                                <Text className="text-slate-900 dark:text-white font-black text-sm mb-1">Knowledge Base</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-3">Flashcard Study</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Notebook')}
                                activeOpacity={0.9}
                                className="flex-1 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
                            >
                                <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl items-center justify-center mb-4">
                                    <MaterialCommunityIcons name="notebook-outline" size={26} color={isDark ? "#818CF8" : "#4F46E5"} />
                                </View>
                                <Text className="text-slate-900 dark:text-white font-black text-sm mb-1">My Revision Pad</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-3">Study Reflections</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Main Module Grid */}
                    <View className="px-6 mb-12">
                        <View className="flex-row justify-between items-end mb-8">
                            <View>
                                <Text className="text-slate-900 dark:text-white text-2xl font-black tracking-tight">Main Curriculum</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Architectural Modules</Text>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Library')}>
                                <Text className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[3px]">Exploration</Text>
                            </TouchableOpacity>
                        </View>

                        {subjects.length > 0 ? (
                            <View className="flex-row flex-wrap justify-between">
                                {subjects.map((subject, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => handleOpenModule(subject)}
                                        className="bg-white dark:bg-slate-900 w-[48.5%] p-6 shadow-sm border border-blue-50 dark:border-slate-800 mb-3 rounded-[38px]"
                                    >
                                        <View className="w-10 h-10 items-center justify-center mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                                            <MaterialCommunityIcons
                                                name={getSubjectIcon(subject)}
                                                size={20}
                                                color={isDark ? "#60A5FA" : "#2563EB"}
                                            />
                                        </View>

                                        <Text className="text-slate-900 dark:text-white font-black text-[13px] uppercase tracking-tighter leading-4 mb-2 h-8" numberOfLines={2}>
                                            {subject}
                                        </Text>

                                        <View className="flex-row items-center mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                                            <Text className="text-[8px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest">
                                                Technical File
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (

                            <View className="bg-white dark:bg-slate-900 p-12 border border-slate-100 dark:border-slate-800 items-center rounded-[38px]">
                                <View className="w-20 h-20 bg-slate-50 dark:bg-slate-800 items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 rounded-[24px]">
                                    <MaterialCommunityIcons name="cube-scan" size={36} color={isDark ? "#475569" : "#CBD5E1"} />
                                </View>
                                <Text className="text-slate-900 dark:text-white font-black text-lg text-center uppercase tracking-tighter">Architecting Curriculum</Text>
                                <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-3 font-medium leading-5 uppercase tracking-widest px-4">
                                    Our academic team is curating high-fidelity modules for your profile.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Medical Term of the Day - Replaces Ward Companion */}
                    <View className="px-6 mb-12">
                        {(() => {
                            const terms = [
                                { term: 'Tachycardia', def: 'A heart rate that exceeds the normal resting rate, usually over 100 beats per minute.' },
                                { term: 'Bradycardia', def: 'A slower than normal heart rate, typically fewer than 60 beats per minute at rest.' },
                                { term: 'Dyspnea', def: 'Difficult or labored breathing; often described as intense tightening in the chest.' },
                                { term: 'Ischemia', def: 'An inadequate blood supply to an organ or part of the body, especially the heart muscles.' },
                                { term: 'Cyanosis', def: 'A bluish discoloration of the skin resulting from poor circulation or inadequate oxygenation.' },
                                { term: 'Edema', def: 'Swelling caused by excess fluid trapped in your body\'s tissues, often in legs or hands.' },
                                { term: 'Syncope', def: 'A temporary loss of consciousness caused by a fall in blood pressure; fainting.' },
                                { term: 'Pruritus', def: 'Severe itching of the skin, which can be a symptom of various medical conditions.' },
                                { term: 'Aphasia', def: 'A language disorder that affects a person\'s ability to communicate and understand speech.' },
                                { term: 'Hypoxia', def: 'A condition in which the body or a region of the body is deprived of adequate oxygen supply.' },
                                { term: 'Hemostasis', def: 'The stopping of a flow of blood; the first stage of wound healing.' },
                                { term: 'Anuria', def: 'The failure of the kidneys to produce urine, often a sign of acute kidney injury.' },
                                { term: 'Polyuria', def: 'The production of abnormally large volumes of dilute urine, common in diabetes.' },
                                { term: 'Atrophy', def: 'The partial or complete wasting away of a part of the body or tissue.' },
                                { term: 'Hyperkalemia', def: 'A high level of potassium in the blood, which can lead to life-threatening heart rhythm issues.' },
                                { term: 'Hypokalemia', def: 'A low level of potassium in the blood, often causing muscle weakness and cardiac arrhythmias.' },
                                { term: 'Orthopnea', def: 'Shortness of breath that occurs when lying flat, common in heart failure patients.' },
                                { term: 'Paresthesia', def: 'An abnormal sensation, typically tingling or pricking ("pins and needles"), caused by pressure on or damage to peripheral nerves.' },
                                { term: 'Hematemesis', def: 'The vomiting of blood, which may be bright red or have a "coffee grounds" appearance.' },
                                { term: 'Hemoptysis', def: 'The coughing up of blood or blood-stained mucus from the bronchi, larynx, trachea, or lungs.' },
                                { term: 'Diaphoresis', def: 'Excessive, abnormal sweating in relation to your surroundings and activity level.' },
                                { term: 'Ecchymosis', def: 'A discoloration of the skin resulting from bleeding underneath, typically caused by bruising.' },
                                { term: 'Epistaxis', def: 'Bleeding from the nose, which can be caused by trauma, dry air, or certain medications.' },
                                { term: 'Nocturia', def: 'A condition in which you wake up during the night because you have to urinate.' },
                                { term: 'Oliguria', def: 'The production of abnormally small amounts of urine (typically less than 400mL/day in adults).' },
                                { term: 'Stridor', def: 'A high-pitched, wheezing sound caused by disrupted airflow, usually indicating an airway obstruction.' },
                                { term: 'Urticaria', def: 'A skin rash with pale red, raised, itchy bumps, commonly known as hives.' },
                                { term: 'Dysphagia', def: 'Difficulty swallowing, which can be caused by neurological damage or physical obstruction.' },
                                { term: 'Malaise', def: 'A general feeling of discomfort, illness, or uneasiness whose exact cause is difficult to identify.' },
                                { term: 'Neuropathy', def: 'Disease or dysfunction of one or more peripheral nerves, typically causing numbness or weakness.' },
                                { term: 'Prophylaxis', def: 'Action taken to prevent disease, especially by specified means or against a specified disease.' },
                                { term: 'Sepsis', def: 'A life-threatening complication of an infection that can lead to tissue damage and organ failure.' },
                                { term: 'Thrombosis', def: 'The formation of a blood clot inside a blood vessel, obstructing the flow of blood through the circulatory system.' },
                                { term: 'Auscultation', def: 'The action of listening to sounds from the heart, lungs, or other organs, typically with a stethoscope.' },
                                { term: 'Palpation', def: 'A method of feeling with the fingers or hands during a physical examination.' },
                                { term: 'Percussion', def: 'A diagnostic procedure designed to determine the density of a body part by the sound produced by tapping it.' },
                                { term: 'Ascites', def: 'The accumulation of fluid in the peritoneal cavity, causing abdominal swelling.' },
                                { term: 'Borborygmi', def: 'A rumbling or gurgling noise made by the movement of fluid and gas in the intestines.' },
                                { term: 'Crepitus', def: 'A grating sound or sensation produced by friction between bone and cartilage or the fractured parts of a bone.' },
                                { term: 'Petechiae', def: 'Small red or purple spots on the skin, caused by a minor bleed from broken capillary blood vessels.' },
                                { term: 'Photophobia', def: 'Abnormal intolerance to light, often a symptom of migraine or meningitis.' },
                                { term: 'Tinnitus', def: 'Ringing or buzzing in the ears that is not caused by an external sound.' },
                                { term: 'Vertigo', def: 'A sensation of whirling and loss of balance, associated with looking down from a great height, or caused by disease of the inner ear or the nerve.' },
                                { term: 'Xerostomia', def: 'Dryness in the mouth, which may be associated with a change in the composition of saliva, or reduced salivary flow.' },
                                { term: 'Anaphylaxis', def: 'A severe, potentially life-threatening allergic reaction that occur rapidly after exposure.' },
                                { term: 'Bradyapnea', def: 'Abnormally slow breathing rate, usually fewer than 12 breaths per minute in an adult.' },
                                { term: 'Tachypnea', def: 'Abnormally rapid breathing, usually greater than 20 breaths per minute in an adult.' },
                                { term: 'Alopecia', def: 'The partial or complete absence of hair from areas of the body where it normally grows.' },
                                { term: 'Analgesia', def: 'The inability to feel pain while still conscious; commonly refers to pain relief medication.' },
                                { term: 'Antipyretic', def: 'Substances or procedures that reduce fever (e.g., acetaminophen, ibuprofen).' },
                                { term: 'Apnea', def: 'The temporary cessation of breathing, especially during sleep.' },
                                { term: 'Benign', def: 'Not harmful in effect; in oncology, it refers to a tumor that is not cancerous.' },
                                { term: 'Malignant', def: 'Used to describe a cancerous tumor that can grow rapidly and spread to other parts of the body.' },
                                { term: 'Biopsy', def: 'An examination of tissue removed from a living body to discover the presence, cause, or extent of a disease.' },
                                { term: 'Catheterization', def: 'The introduction of a catheter usually into the bladder, for withdrawing urine.' },
                                { term: 'Comorbidity', def: 'The simultaneous presence of two or more diseases or medical conditions in a patient.' },
                                { term: 'Contraindication', def: 'A condition or factor that serves as a reason to withhold a certain medical treatment due to the harm that it would cause the patient.' },
                                { term: 'Debridement', def: 'The removal of damaged tissue or foreign objects from a wound.' },
                                { term: 'Dialysis', def: 'The clinical purification of blood by a machine, as a substitute for the normal function of the kidney.' },
                                { term: 'Diplopia', def: 'Technical term for double vision.' },
                                { term: 'Diuretic', def: 'A substance that promotes increased production of urine.' },
                                { term: 'Dysuria', def: 'Painful or difficult urination.' },
                                { term: 'Embolism', def: 'Obstruction of an artery, typically by a clot of blood or an air bubble.' },
                                { term: 'Emesis', def: 'The action or process of vomiting.' },
                                { term: 'Endoscopy', def: 'A nonsurgical procedure used to examine a person\'s digestive tract.' },
                                { term: 'Erythema', def: 'Superficial reddening of the skin, usually in patches, as a result of injury or irritation causing dilatation of the blood capillaries.' },
                                { term: 'Exacerbation', def: 'The worsening of a disease or an increase in its symptoms.' },
                                { term: 'Febrile', def: 'Having or showing the symptoms of a fever.' },
                                { term: 'Fistula', def: 'An abnormal or surgically made passage between a hollow or tubular organ and the body surface, or between two hollow organs.' },
                                { term: 'Gastritis', def: 'Inflammation of the lining of the stomach.' },
                                { term: 'Gingivitis', def: 'Inflammation of the gums.' },
                                { term: 'Hemorrhage', def: 'An escape of blood from a ruptured blood vessel, especially when profuse.' },
                                { term: 'Hepatitis', def: 'Inflammation of the liver.' },
                                { term: 'Hypoglycemia', def: 'Deficiency of glucose in the bloodstream.' },
                                { term: 'Hyperglycemia', def: 'An excess of glucose in the bloodstream, often associated with diabetes mellitus.' },
                                { term: 'Idiopathic', def: 'Relating to or denoting any disease or condition that arises spontaneously or for which the cause is unknown.' },
                                { term: 'Incontinence', def: 'Lack of voluntary control over urination or defecation.' },
                                { term: 'Intubation', def: 'The insertion of a tube into a patient\'s body, especially that of an artificial ventilation tube into the trachea.' },
                                { term: 'Jaundice', def: 'A medical condition with yellowing of the skin or whites of the eyes, arising from excess of the pigment bilirubin.' },
                                { term: 'Lethargy', def: 'A lack of energy and enthusiasm; a pathological state of sleepiness or deep unresponsiveness.' },
                                { term: 'Mastectomy', def: 'A surgical operation to remove a breast.' },
                                { term: 'Melena', def: 'Dark sticky feces containing partly digested blood.' },
                                { term: 'Metastasis', def: 'The development of secondary malignant growths at a distance from a primary site of cancer.' },
                                { term: 'Necrosis', def: 'The death of most or all of the cells in an organ or tissue due to disease, injury, or failure of the blood supply.' },
                                { term: 'Nephritis', def: 'Inflammation of the kidneys.' },
                                { term: 'Nosocomial', def: 'Originating in a hospital; typically refers to infections acquired during a hospital stay.' },
                                { term: 'Palliation', def: 'Relief of symptoms and suffering caused by cancer and other life-threatening diseases.' },
                                { term: 'Peritonitis', def: 'Inflammation of the peritoneum, typically caused by bacterial infection either via the blood or after rupture of an abdominal organ.' },
                                { term: 'Placebo', def: 'A harmless pill, medicine, or procedure prescribed more for the psychological benefit to the patient than for any physiological effect.' },
                                { term: 'Pneumothorax', def: 'The presence of air or gas in the cavity between the lungs and the chest wall, causing collapse of the lung.' },
                                { term: 'Polydipsia', def: 'Abnormally great thirst as a symptom of disease (such as diabetes) or psychological disturbance.' },
                                { term: 'Prognosis', def: 'The likely course of a disease or ailment.' },
                                { term: 'Remission', def: 'A diminution of the seriousness or intensity of disease or pain; a temporary recovery.' },
                                { term: 'Rhinorrhea', def: 'A condition where the nasal cavity is filled with a significant amount of mucus fluid (runny nose).' },
                                { term: 'Stenosis', def: 'The abnormal narrowing of a passage in the body.' },
                                { term: 'Suture', def: 'A stitch or row of stitches holding together the edges of a wound or surgical incision.' },
                                { term: 'Synovitis', def: 'Inflammation of a synovial membrane.' },
                                { term: 'Systemic', def: 'Relating to a system, especially as opposed to a particular part.' },
                                { term: 'Triage', def: 'The assignment of degrees of urgency to wounds or illnesses to decide the order of treatment in a large number of patients or casualties.' }
                            ];

                            // Date-stable rotation (changes every 24 hours)
                            const today = new Date();
                            const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
                            const dailyTerm = terms[seed % terms.length];

                            return (
                                <View className="relative">
                                    <LinearGradient
                                        colors={['#1E1B4B', '#2563EB']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        className="p-8 shadow-2xl shadow-indigo-100 rounded-[32px] overflow-hidden"
                                    >
                                        <View className="flex-row justify-between items-start mb-6">
                                            <View className="bg-white/10 px-3 py-1">
                                                <Text className="text-blue-300 font-black text-[10px] uppercase tracking-[3px]">Daily Insight</Text>
                                            </View>
                                            <MaterialCommunityIcons name="molecule" size={24} color="rgba(255,255,255,0.2)" />
                                        </View>

                                        <Text className="text-white font-black text-2xl mb-3 tracking-tight">
                                            {dailyTerm.term}
                                        </Text>
                                        <Text className="text-slate-300 font-medium text-sm leading-6">
                                            {dailyTerm.def}
                                        </Text>

                                        <View className="absolute -bottom-2 -right-2 opacity-[0.03]">
                                            <MaterialCommunityIcons name="medical-bag" size={140} color="white" />
                                        </View>
                                    </LinearGradient>
                                </View>
                            );
                        })()}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const getSubjectIcon = (subject: string): any => {
    const s = subject.toLowerCase();
    if (s.includes('anatomy')) return 'bone';
    if (s.includes('nurs')) return 'medical-bag';
    if (s.includes('care plan')) return 'clipboard-pulse-outline';
    if (s.includes('pharmacology')) return 'pill';
    if (s.includes('physio')) return 'heart-pulse';
    if (s.includes('bio')) return 'microscope';
    if (s.includes('psych')) return 'brain';
    if (s.includes('medic')) return 'hospital-box-outline';
    if (s.includes('math')) return 'calculator';
    return 'book-open-blank-variant';
};

export default HomeScreen;
