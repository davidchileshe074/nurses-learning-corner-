import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { account } from '../services/appwriteClient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const ResetPasswordScreen = ({ route, navigation }: any) => {
    const { userId, secret } = route.params || {};
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const scheme = useColorScheme();
    const isDark = scheme === 'dark';

    useEffect(() => {
        if (!userId || !secret) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Link',
                text2: 'This password reset link is invalid or has expired.'
            });
            navigation.navigate('Login');
        }
    }, [userId, secret]);

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all fields'
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Passwords do not match'
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
            await account.updateRecovery(userId, secret, password);
            Toast.show({
                type: 'success',
                text1: 'Password Reset Successful',
                text2: 'You can now log in with your new password.'
            });
            navigation.navigate('Login');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Reset Failed',
                text2: error.message || 'An error occurred. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top', 'bottom']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    className="px-6"
                >
                    <View className="flex-1 justify-center py-10">
                        <View className="items-center mb-10">
                            <View className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
                                <MaterialCommunityIcons name="lock-reset" size={48} color={isDark ? "#60A5FA" : "#2563EB"} />
                            </View>
                            <Text className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">New Password</Text>
                            <Text className="text-slate-600 dark:text-slate-400 text-lg mt-2 text-center font-medium">Create a secure password for your account</Text>
                        </View>

                        <View className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <View className="mb-6">
                                <Text className="text-slate-900 dark:text-slate-300 text-sm font-bold uppercase tracking-wider mb-2 ml-1">New Password</Text>
                                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-14">
                                    <MaterialCommunityIcons name="lock-outline" size={20} color={isDark ? "#64748B" : "#94A3B8"} />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-900 dark:text-white font-medium"
                                        placeholder="••••••••"
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <MaterialCommunityIcons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color={isDark ? "#64748B" : "#94A3B8"}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="mb-8">
                                <Text className="text-slate-900 dark:text-slate-300 text-sm font-bold uppercase tracking-wider mb-2 ml-1">Confirm Password</Text>
                                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-14">
                                    <MaterialCommunityIcons name="lock-check-outline" size={20} color={isDark ? "#64748B" : "#94A3B8"} />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-900 dark:text-white font-medium"
                                        placeholder="••••••••"
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                className={`bg-blue-600 dark:bg-blue-600 h-14 rounded-xl items-center justify-center shadow-md ${loading ? 'opacity-70' : ''}`}
                                onPress={handleResetPassword}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Reset Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            className="mt-8 items-center"
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text className="text-slate-500 dark:text-slate-400 font-bold">Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ResetPasswordScreen;
