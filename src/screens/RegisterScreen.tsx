import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Program, YearOfStudy } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const RegisterScreen = ({ navigation }: any) => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const { setUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy>('YEAR1');
    const [program, setProgram] = useState<Program>('REGISTERED-NURSING');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const programs: { value: Program; label: string }[] = [
        { value: 'REGISTERED-NURSING', label: 'Registered Nursing' },
        { value: 'MIDWIFERY', label: 'Midwifery' },
        { value: 'PUBLIC-HEALTH', label: 'Published Health Nursing' },
        { value: 'MENTAL-HEALTH', label: 'Mental Health Nursing' },
        { value: 'ONCOLOGY', label: 'Oncology Nursing' },
        { value: 'PAEDIATRIC', label: 'Paediatric Nursing' },
    ];

    const years: { label: string; value: YearOfStudy }[] = [
        { label: 'Year 1', value: 'YEAR1' },
        { label: 'Year 2', value: 'YEAR2' },
        { label: 'Year 3', value: 'YEAR3' },
    ];

    const handleRegister = async () => {
        if (!email || !password || !fullName || !whatsappNumber) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all required fields'
            });
            return;
        }

        if (password.length < 8) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Password must be at least 8 characters long'
            });
            return;
        }

        setLoading(true);
        try {
            const profile = await signUp(email, password, fullName, whatsappNumber, yearOfStudy, program);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Account created! Please verify your email address.'
            });
            setUser(profile as any);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top', 'bottom']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    className="px-6 pb-12"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View className="py-6 mb-2">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="w-10 h-10 -ml-2 mb-4 items-center justify-center rounded-full active:bg-slate-50 dark:active:bg-slate-900"
                        >
                            <MaterialCommunityIcons name="arrow-left" size={28} color={isDark ? "#FFFFFF" : "#0F172A"} />
                        </TouchableOpacity>
                        <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Create Account</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-base font-medium leading-6">Join us to access your specialized nursing curriculum.</Text>
                    </View>

                    {/* Inputs */}
                    <View className="space-y-6">
                        {/* Personal Info Group */}
                        <View>
                            <View className="flex-row items-center mb-4">
                                <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest">Personal Information</Text>
                                <View className="h-[1px] bg-blue-100 dark:bg-blue-900/40 flex-1 ml-4" />
                            </View>

                            <View className="space-y-4">
                                <View>
                                    <Text className="text-slate-900 dark:text-slate-300 font-bold text-sm mb-2 ml-1">Full Name</Text>
                                    <TextInput
                                        className="bg-slate-50 dark:bg-slate-900 h-14 px-4 rounded-xl text-slate-900 dark:text-white font-semibold text-base border border-slate-200 dark:border-slate-800 focus:border-blue-600 dark:focus:border-blue-500"
                                        placeholder="e.g. Sarah Phiri"
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>

                                <View>
                                    <Text className="text-slate-900 dark:text-slate-300 font-bold text-sm mb-2 ml-1">Email Address</Text>
                                    <TextInput
                                        className="bg-slate-50 dark:bg-slate-900 h-14 px-4 rounded-xl text-slate-900 dark:text-white font-semibold text-base border border-slate-200 dark:border-slate-800 focus:border-blue-600 dark:focus:border-blue-500"
                                        placeholder="student@example.com"
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View>
                                    <Text className="text-slate-900 dark:text-slate-300 font-bold text-sm mb-2 ml-1">WhatsApp Number</Text>
                                    <TextInput
                                        className="bg-slate-50 dark:bg-slate-900 h-14 px-4 rounded-xl text-slate-900 dark:text-white font-semibold text-base border border-slate-200 dark:border-slate-800 focus:border-blue-600 dark:focus:border-blue-500"
                                        placeholder="+260 97..."
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        value={whatsappNumber}
                                        onChangeText={setWhatsappNumber}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Security Group */}
                        <View className="pt-4">
                            <View className="flex-row items-center mb-4">
                                <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest">Security</Text>
                                <View className="h-[1px] bg-blue-100 dark:bg-blue-900/40 flex-1 ml-4" />
                            </View>

                            <View>
                                <Text className="text-slate-900 dark:text-slate-300 font-bold text-sm mb-2 ml-1">Password</Text>
                                <View className="bg-slate-50 dark:bg-slate-900 h-14 px-4 rounded-xl flex-row items-center border border-slate-200 dark:border-slate-800 focus:border-blue-600">
                                    <TextInput
                                        className="flex-1 text-slate-900 dark:text-white font-semibold text-base h-full"
                                        placeholder="Min 8 characters"
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                                        <MaterialCommunityIcons
                                            name={showPassword ? "eye-off" : "eye"}
                                            size={20}
                                            color={isDark ? "#64748B" : "#94A3B8"}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Academic Group */}
                        <View className="pt-4">
                            <View className="flex-row items-center mb-4">
                                <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest">Academic Profile</Text>
                                <View className="h-[1px] bg-blue-100 dark:bg-blue-900/40 flex-1 ml-4" />
                            </View>

                            <View className="mb-6">
                                <Text className="text-slate-900 dark:text-slate-300 font-bold text-sm mb-3 ml-1">Year of Study</Text>
                                <View className="flex-row gap-3">
                                    {years.map((y) => (
                                        <TouchableOpacity
                                            key={y.value}
                                            onPress={() => setYearOfStudy(y.value)}
                                            className={`flex-1 h-12 rounded-xl items-center justify-center border ${yearOfStudy === y.value
                                                ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-200 dark:shadow-none'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                                }`}
                                        >
                                            <Text className={`font-bold text-sm ${yearOfStudy === y.value ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {y.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View>
                                <Text className="text-slate-900 dark:text-slate-300 font-bold text-sm mb-3 ml-1">Program</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {programs.map((p) => {
                                        const isSelected = program === p.value;
                                        return (
                                            <TouchableOpacity
                                                key={p.value}
                                                onPress={() => setProgram(p.value)}
                                                className={`px-4 py-3 rounded-xl border mb-1 ${isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-600'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                                    }`}
                                            >
                                                <Text className={`font-bold text-xs ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {p.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Action Button */}
                    <View className="mt-10 mb-6">
                        <TouchableOpacity
                            className={`bg-blue-600 h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98] ${loading ? 'opacity-80' : ''}`}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-black text-lg uppercase tracking-widest">Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            className="flex-row justify-center items-center mt-6 py-4"
                        >
                            <Text className="text-slate-500 dark:text-slate-400 font-medium text-base">Already have an account? </Text>
                            <Text className="text-blue-600 dark:text-blue-400 font-black text-base">Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default RegisterScreen;


