import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getContent } from '../services/content';
import { ContentItem, Subject } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatProgram, formatYear } from '../utils/formatters';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getSubscriptionStatus } from '../services/subscription';
import { Subscription, AppNotification } from '../types';
import { checkAndGenerateNotifications, getNotifications } from '../services/notifications';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [stats, setStats] = useState({ totalItems: 0, subjectsCount: 0 });
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    const fetchData = useCallback(async (isInitial = false) => {
        if (!user) return;
        if (isInitial) setLoading(true);
        else setRefreshing(true);

        try {
            const [content, subStatus] = await Promise.all([
                getContent(user.program, user.yearOfStudy),
                getSubscriptionStatus(user.userId)
            ]);

            const uniqueSubjects = [...new Set(content.map(item => item.subject).filter(Boolean))] as Subject[];

            setSubjects(uniqueSubjects);
            setSubscription(subStatus);
            setStats({
                totalItems: content.length,
                subjectsCount: uniqueSubjects.length
            });

            // Check for notifications
            await checkAndGenerateNotifications(user, subStatus);
            const notifications = await getNotifications();
            setHasUnread(notifications.some(n => !n.isRead));
        } catch (error) {
            console.error('[Home] Fetch Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData(true);
    }, [user?.program, user?.yearOfStudy]);

    const daysRemaining = useMemo(() => {
        if (!subscription?.endDate) return null;
        const expiryDate = new Date(subscription.endDate);
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }, [subscription]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="mt-4 text-slate-400 font-bold tracking-[3px] text-[10px] uppercase">Preparing Dashboard</Text>
            </View>
        );
    }

    const firstName = user?.fullName?.split(' ')[0] || 'Student';

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="flex-1"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchData} colors={["#2563EB"]} />
                    }
                >
                    {/* Top Header */}
                    <View className="px-6 py-8 flex-row justify-between items-center">
                        <View>
                            <Text className="text-slate-500 text-sm font-black uppercase tracking-[2px] mb-1">Nursing Excellence</Text>
                            <Text className="text-3xl font-black text-slate-900 tracking-tighter">Hi, {firstName} 👋</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Account')}
                            className="w-14 h-14 bg-white rounded-3xl items-center justify-center shadow-sm border border-slate-100 relative"
                        >
                            <MaterialCommunityIcons name="account" size={28} color="#2563EB" />
                            {hasUnread && (
                                <View className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Program Status Hero - Unified Brand Style */}
                    <View className="px-6 mb-10">
                        <LinearGradient
                            colors={['#2563EB', '#172554']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="p-8 rounded-[38px] shadow-2xl shadow-blue-200 relative overflow-hidden"
                        >
                            {/* Unified Background Detail */}
                            <View className="absolute -bottom-2 -right-2 opacity-[0.03]">
                                <MaterialCommunityIcons name="shield-check" size={140} color="white" />
                            </View>

                            <View className="relative z-10">
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-row items-center">
                                        <View className="bg-blue-500/20 px-3 py-1 rounded-xl mr-2">
                                            <Text className="text-blue-400 font-black text-[10px] uppercase tracking-[2px]">Active Enrollment</Text>
                                        </View>
                                        {daysRemaining !== null && (
                                            <View className="bg-white/10 px-2.5 py-1 rounded-xl">
                                                <Text className="text-blue-300 font-black text-[9px] uppercase tracking-widest">{daysRemaining} Days Left</Text>
                                            </View>
                                        )}
                                    </View>
                                    <MaterialCommunityIcons name="shield-check" size={24} color="rgba(255,255,255,0.4)" />
                                </View>

                                <Text className="text-white text-3xl font-black mb-2 tracking-tighter leading-tight" numberOfLines={2}>
                                    {user?.program ? formatProgram(user.program) : 'Loading...'}
                                </Text>
                                <Text className="text-slate-300 font-medium text-sm leading-6">
                                    {user?.yearOfStudy ? `Academic Year ${formatYear(user.yearOfStudy)}` : ''}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Quick Access Grid */}
                    <View className="px-6 mb-8">
                        <View className="flex-row justify-between items-end mb-6 px-1">
                            <View>
                                <Text className="text-slate-900 text-2xl font-black tracking-tight">Your Modules</Text>
                                <Text className="text-slate-400 text-xs font-bold mt-1">Explore specialized nursing content</Text>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Library')}>
                                <Text className="text-brand font-black text-sm uppercase tracking-wider">Expand All</Text>
                            </TouchableOpacity>
                        </View>

                        {subjects.length > 0 ? (
                            <View className="flex-row flex-wrap justify-between">
                                {subjects.map((subject, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => navigation.navigate('Library', { subject })}
                                        className="bg-white w-[48.5%] p-5 rounded-[32px] shadow-sm shadow-blue-100 border border-blue-100 mb-4"
                                    >
                                        <View className="w-12 h-12 rounded-2xl items-center justify-center mb-4 bg-blue-50 border border-blue-100">
                                            <MaterialCommunityIcons
                                                name={getSubjectIcon(subject)}
                                                size={26}
                                                color="#2563EB"
                                            />
                                        </View>

                                        <Text className="text-blue-400 text-[10px] font-black uppercase tracking-[2px] mb-1">
                                            Module
                                        </Text>

                                        <Text className="text-slate-800 font-black text-sm leading-5 mb-2" numberOfLines={2}>
                                            {subject}
                                        </Text>

                                        <View className="flex-row items-center mt-auto">
                                            <View className="w-1.5 h-1.5 rounded-full mr-2 bg-blue-500" />
                                            <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                View Content
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View className="bg-white p-12 rounded-[40px] border border-slate-200 border-dashed items-center">
                                <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
                                    <MaterialCommunityIcons name="book-open-variant" size={36} color="#CBD5E1" />
                                </View>
                                <Text className="text-slate-900 font-black text-lg text-center">Curriculum Pending</Text>
                                <Text className="text-slate-500 text-sm text-center mt-2 leading-5">Our academic team is curating modules for your level. Check back soon!</Text>
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
                            ];

                            // Date-stable rotation (changes every 24 hours)
                            const today = new Date();
                            const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
                            const dailyTerm = terms[seed % terms.length];

                            return (
                                <View className="relative">
                                    <LinearGradient
                                        colors={['#3B82F6', '#2563EB']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        className="p-8 rounded-[38px] shadow-2xl shadow-blue-200"
                                    >
                                        <View className="flex-row justify-between items-start mb-4">
                                            <View className="bg-blue-500/20 px-3 py-1 rounded-xl">
                                                <Text className="text-blue-400 font-black text-[10px] uppercase tracking-[2px]">Daily Insight</Text>
                                            </View>
                                            <MaterialCommunityIcons name="molecule" size={24} color="rgba(255,255,255,0.4)" />
                                        </View>

                                        <Text className="text-white font-black text-2xl mb-2 tracking-tight">
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
    if (s.includes('pharmacology')) return 'pill';
    if (s.includes('physio')) return 'heart-pulse';
    if (s.includes('bio')) return 'microscope';
    if (s.includes('psych')) return 'brain';
    if (s.includes('medic')) return 'hospital-box-outline';
    if (s.includes('math')) return 'calculator';
    return 'book-open-blank-variant';
};

export default HomeScreen;
