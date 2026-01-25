import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn, getCurrentUser, sendPasswordResetEmail } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password State
    const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const { setUser } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all fields'
            });
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            const profile = await getCurrentUser();
            if (profile) {
                setUser(profile as any);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!resetEmail) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please enter your email address'
            });
            return;
        }

        setResetLoading(true);
        try {
            await sendPasswordResetEmail(resetEmail);
            Toast.show({
                type: 'success',
                text1: 'Check Your Email',
                text2: 'We have sent password reset instructions.',
                onPress: () => setForgotPasswordModalVisible(false)
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to send reset email. Please try again.'
            });
        } finally {
            setResetLoading(false);
        }
    };

    const openForgotPassword = () => {
        setResetEmail(email); // Pre-fill with current email input
        setForgotPasswordModalVisible(true);
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />
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
                        {/* Brand Header */}
                        <View className="items-center mb-12">
                            <View className="w-20 h-20 bg-white rounded-3xl items-center justify-center shadow-sm border border-slate-100 mb-6">
                                <MaterialCommunityIcons name="heart-pulse" size={48} color="#2563EB" />
                            </View>
                            <Text className="text-3xl font-bold text-slate-900 tracking-tight">Nurse Learning</Text>
                            <Text className="text-slate-600 text-lg mt-2 text-center font-medium">Your companion in excellence</Text>
                        </View>

                        {/* Form Section */}
                        <View className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                            <View className="mb-6">
                                <Text className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-2 ml-1">Email Address</Text>
                                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-14">
                                    <MaterialCommunityIcons name="email-outline" size={20} color="#94A3B8" />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-900 font-medium"
                                        placeholder="nurse@example.com"
                                        placeholderTextColor="#94A3B8"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View className="mb-4">
                                <Text className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-2 ml-1">Password</Text>
                                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-14">
                                    <MaterialCommunityIcons name="lock-outline" size={20} color="#94A3B8" />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-900 font-medium"
                                        placeholder="••••••••"
                                        placeholderTextColor="#94A3B8"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <MaterialCommunityIcons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#94A3B8"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity className="self-end mb-8" onPress={openForgotPassword}>
                                <Text className="text-blue-600 font-bold text-sm">Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`bg-blue-600 h-14 rounded-xl items-center justify-center shadow-md ${loading ? 'opacity-70' : ''}`}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Sign In</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View className="flex-row justify-center mt-10">
                            <Text className="text-slate-600 text-base">Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text className="text-blue-600 font-extrabold text-base">Create One</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Forgot Password Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={forgotPasswordModalVisible}
                onRequestClose={() => setForgotPasswordModalVisible(false)}
            >
                <View className="flex-1 justify-end">
                    {/* Backdrop */}
                    <TouchableOpacity
                        className="absolute inset-0 bg-black/50"
                        activeOpacity={1}
                        onPress={() => setForgotPasswordModalVisible(false)}
                    />

                    {/* Modal Content */}
                    <View className="bg-white rounded-t-[32px] p-8 pb-12 shadow-2xl">
                        <View className="items-center mb-6">
                            <View className="w-16 h-1 bg-slate-200 rounded-full mb-6" />
                            <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center mb-4">
                                <MaterialCommunityIcons name="lock-reset" size={28} color="#2563EB" />
                            </View>
                            <Text className="text-2xl font-bold text-slate-900">Reset Password</Text>
                            <Text className="text-slate-500 text-center mt-2 mx-4">
                                Enter your email address and we'll send you instructions to reset your password.
                            </Text>
                        </View>

                        <View className="mb-8">
                            <Text className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-2 ml-1">Email Address</Text>
                            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-14">
                                <MaterialCommunityIcons name="email-outline" size={20} color="#94A3B8" />
                                <TextInput
                                    className="flex-1 ml-3 text-slate-900 font-medium"
                                    placeholder="nurse@example.com"
                                    placeholderTextColor="#94A3B8"
                                    value={resetEmail}
                                    onChangeText={setResetEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            className={`bg-blue-600 h-14 rounded-xl items-center justify-center shadow-lg shadow-blue-200 ${resetLoading ? 'opacity-70' : ''}`}
                            onPress={handleForgotPassword}
                            disabled={resetLoading}
                        >
                            {resetLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Send Reset Link</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-6 items-center py-2"
                            onPress={() => setForgotPasswordModalVisible(false)}
                        >
                            <Text className="text-slate-500 font-bold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default LoginScreen;


