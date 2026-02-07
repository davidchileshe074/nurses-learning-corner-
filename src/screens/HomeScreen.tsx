import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    useColorScheme
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
import * as FileSystem from 'expo-file-system/legacy';
import { Spacing, Colors, Shadow, Typography, BorderRadius } from '../theme';
import LoadingView from '../components/LoadingView';

const { width } = Dimensions.get('window');
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

const MEDICAL_TERMS = [
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

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    if (loading) {
        return <LoadingView message="Loading Resources" />;
    }

    const firstName = user?.fullName?.split(' ')[0] || 'Student';

    // Term of the day rotation
    const dailyTerm = (() => {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        return MEDICAL_TERMS[seed % MEDICAL_TERMS.length];
    })();

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar style="light" backgroundColor={Colors.primary} />

            {/* Header and Status Bar Area */}
            <View style={{ backgroundColor: Colors.primary, ...Shadow.small }}>
                <SafeAreaView edges={['top']}>
                    <View style={{
                        height: 56,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: Spacing.md,
                        justifyContent: 'space-between',
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => navigation.openDrawer()}>
                                <MaterialCommunityIcons name="menu" size={24} color={Colors.white} style={{ marginRight: Spacing.md }} />
                            </TouchableOpacity>
                            <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }}>Nurse Corner</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => navigation.navigate('Account')}>
                                <View style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <MaterialCommunityIcons name="account" size={20} color={Colors.white} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            <View style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchData} colors={[Colors.primary]} />
                    }
                >
                    {/* Welcome Section */}
                    <View style={{ padding: Spacing.lg, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                        <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: Spacing.xs }}>
                            {greeting}, {firstName}
                        </Text>
                        <Text style={Typography.h1}>Academic Dashboard</Text>
                    </View>

                    {/* DHIS2 Info Widget */}
                    <View style={{ padding: Spacing.md }}>
                        <View style={{
                            backgroundColor: Colors.white,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            borderRadius: BorderRadius.md,
                            padding: Spacing.md,
                            ...Shadow.small
                        }}>
                            <View style={{ marginBottom: Spacing.md }}>
                                <Text style={Typography.label}>Current Program</Text>
                                <Text style={Typography.h2}>
                                    {user?.program ? formatProgram(user.program) : 'Curriculum Not Set'}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={Typography.caption}>Access Status</Text>
                                    <Text style={{ ...Typography.body, fontWeight: '700', color: Colors.primary }}>
                                        {daysRemaining !== null ? `${daysRemaining} Days Remaining` : 'No Active Access'}
                                    </Text>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={Typography.caption}>Resources</Text>
                                    <Text style={{ ...Typography.body, fontWeight: '700' }}>{stats.totalItems} Available</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Recent Content List - DHIS2 Style */}
                    {recentItems.length > 0 && (
                        <View style={{ marginBottom: Spacing.xl }}>
                            <View style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}>
                                <Text style={Typography.h3}>Recently Accessed</Text>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: Spacing.md }}
                            >
                                {recentItems.map((item) => (
                                    <TouchableOpacity
                                        key={item.$id}
                                        onPress={() => navigation.navigate('ContentDetail', { item })}
                                        style={{
                                            width: 250,
                                            backgroundColor: Colors.white,
                                            marginRight: Spacing.md,
                                            padding: Spacing.md,
                                            borderWidth: 1,
                                            borderColor: Colors.border,
                                            borderRadius: BorderRadius.md,
                                            ...Shadow.small
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="file-document" size={20} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
                                            <Text style={{ ...Typography.body, fontWeight: '600', flex: 1 }} numberOfLines={1}>{item.title}</Text>
                                        </View>
                                        <View style={{ marginTop: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={Typography.caption}>{item.type.replace('_', ' ')}</Text>
                                            <MaterialCommunityIcons name="arrow-right" size={14} color={Colors.textMuted} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Revision Grid */}
                    <View style={{ padding: Spacing.md }}>
                        <Text style={{ ...Typography.h3, marginBottom: Spacing.md }}>Study Tools</Text>
                        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('FlashcardDecks')}
                                style={{
                                    flex: 1,
                                    backgroundColor: Colors.white,
                                    padding: Spacing.md,
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    borderRadius: BorderRadius.md,
                                    alignItems: 'center',
                                    ...Shadow.small
                                }}
                            >
                                <MaterialCommunityIcons name="cards-variant" size={32} color={Colors.primary} />
                                <Text style={{ ...Typography.body, fontWeight: '700', marginTop: Spacing.sm }}>Flashcards</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Notebook')}
                                style={{
                                    flex: 1,
                                    backgroundColor: Colors.white,
                                    padding: Spacing.md,
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    borderRadius: BorderRadius.md,
                                    alignItems: 'center',
                                    ...Shadow.small
                                }}
                            >
                                <MaterialCommunityIcons name="notebook" size={32} color={Colors.success} />
                                <Text style={{ ...Typography.body, fontWeight: '700', marginTop: Spacing.sm }}>Notebook</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Modules List - DHIS2 Style (Linear instead of Grid for cleaner look) */}
                    <View style={{ padding: Spacing.md }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                            <Text style={Typography.h3}>Curriculum Modules</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Library')}>
                                <Text style={{ ...Typography.caption, color: Colors.primary, fontWeight: '700' }}>VIEW LIBRARY</Text>
                            </TouchableOpacity>
                        </View>

                        {subjects.length > 0 ? (
                            <View>
                                {subjects.map((subject, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => handleOpenModule(subject)}
                                        style={{
                                            backgroundColor: Colors.white,
                                            padding: Spacing.md,
                                            borderWidth: 1,
                                            borderColor: Colors.border,
                                            borderRadius: BorderRadius.sm, // Standard radius
                                            marginBottom: Spacing.sm,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            ...Shadow.small
                                        }}
                                    >
                                        <View style={{
                                            width: 40,
                                            height: 40,
                                            backgroundColor: Colors.primaryLight,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: BorderRadius.sm,
                                            marginRight: Spacing.md
                                        }}>
                                            <MaterialCommunityIcons
                                                name={getSubjectIcon(subject)}
                                                size={20}
                                                color={Colors.primary}
                                            />
                                        </View>
                                        <Text style={{ ...Typography.body, fontWeight: '600', flex: 1 }}>{subject}</Text>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={{ padding: Spacing.xl, alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border }}>
                                <Text style={Typography.body}>No modules found for your program.</Text>
                            </View>
                        )}
                    </View>

                    {/* Daily Insight - DHIS2 Style (No gradients) */}
                    <View style={{ padding: Spacing.md, marginBottom: Spacing.xl }}>
                        <View style={{
                            backgroundColor: Colors.primaryDark,
                            padding: Spacing.md,
                            borderRadius: BorderRadius.md,
                            borderLeftWidth: 4,
                            borderLeftColor: Colors.warning
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
                                <MaterialCommunityIcons name="lightbulb-on" size={16} color={Colors.warning} style={{ marginRight: Spacing.xs }} />
                                <Text style={{ ...Typography.label, color: Colors.white }}>Term of the Day</Text>
                            </View>
                            <Text style={{ ...Typography.h3, color: Colors.white, marginBottom: Spacing.xs }}>{dailyTerm.term}</Text>
                            <Text style={{ ...Typography.body, color: Colors.primaryLight }}>{dailyTerm.def}</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

export default HomeScreen;
