import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { changePassword, deleteAccount } from '../services/auth';

const PrivacyScreen = ({ navigation }: any) => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const { user, signOut } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Missing Fields', 'Please fill in all password fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('Weak Password', 'New password must be at least 8 characters long.');
            return;
        }

        setLoading(true);
        try {
            await changePassword(newPassword, oldPassword);
            Alert.alert('Success', 'Password changed successfully!');
            setModalVisible(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to change password. Please check your current password.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you absolutely sure? This action will permanently remove your study progress and profile. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await deleteAccount(user!.$id);
                            // AuthContext will automatically handle the lack of user session
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete account.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <View className="flex-row items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                    <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? "#FFFFFF" : "#1E293B"} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900 dark:text-white ml-2">Privacy & Security</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                <View className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 mb-6">
                    <View className="flex-row items-center mb-6">
                        <View className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl items-center justify-center">
                            <MaterialCommunityIcons name="shield-check" size={24} color="#16A34A" />
                        </View>
                        <View className="ml-4">
                            <Text className="text-slate-900 dark:text-white font-bold text-lg">Your data is secure</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm">We use end-to-end encryption</Text>
                        </View>
                    </View>

                    <Text className="text-slate-900 dark:text-white font-bold mb-2">Privacy Policy</Text>
                    <Text className="text-slate-600 dark:text-slate-400 leading-6 mb-4">
                        At Nurse Learning Corner, we are committed to protecting your privacy. We only collect necessary information to provide you with the best educational experience.
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-400 leading-6 mb-4">
                        1. <Text className="font-bold">Information Collection:</Text> We collect your name, email, and academic details to personalize your learning journey.
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-400 leading-6 mb-4">
                        2. <Text className="font-bold">Data Usage:</Text> Your data is used exclusively for app functionality and is never shared with third parties for marketing purposes.
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-400 leading-6 mb-4">
                        3. <Text className="font-bold">Device Security:</Text> We link your account to a single device to ensure content security and prevent unauthorized access.
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-row items-center mb-4"
                >
                    <MaterialCommunityIcons name="lock-reset" size={22} color={isDark ? "#94A3B8" : "#64748B"} />
                    <Text className="flex-1 ml-4 text-slate-800 dark:text-white font-bold">Change Password</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? "#475569" : "#CBD5E1"} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-row items-center mb-10"
                >
                    <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
                    <Text className="flex-1 ml-4 text-red-600 font-bold">Delete Account</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? "#475569" : "#CBD5E1"} />
                </TouchableOpacity>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/50">
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setModalVisible(false)}
                        className="absolute inset-0"
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        className="flex-1 justify-end"
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    >
                        <View className="bg-white dark:bg-slate-900 rounded-t-[40px] p-8 pb-12 max-h-[90%]">
                            <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full self-center mb-8" />

                            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2">Change Password</Text>
                            <Text className="text-slate-500 dark:text-slate-400 font-medium mb-8">Keep your account secure with a strong password.</Text>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingBottom: 20 }}
                            >
                                <Text className="text-slate-900 dark:text-slate-300 font-bold text-xs uppercase tracking-widest mb-2 ml-1">Current Password</Text>
                                <View className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 h-14 flex-row items-center mb-4">
                                    <MaterialCommunityIcons name="lock-outline" size={20} color={isDark ? "#64748B" : "#94A3B8"} />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-900 dark:text-white font-medium"
                                        placeholder="Enter current password"
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        secureTextEntry
                                        value={oldPassword}
                                        onChangeText={setOldPassword}
                                    />
                                </View>

                                <Text className="text-slate-900 dark:text-slate-300 font-bold text-xs uppercase tracking-widest mb-2 ml-1">New Password</Text>
                                <View className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 h-14 flex-row items-center mb-4">
                                    <MaterialCommunityIcons name="lock-plus-outline" size={20} color={isDark ? "#64748B" : "#94A3B8"} />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-900 dark:text-white font-medium"
                                        placeholder="Min 8 characters"
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        secureTextEntry
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                </View>

                                <Text className="text-slate-900 dark:text-slate-300 font-bold text-xs uppercase tracking-widest mb-2 ml-1">Confirm New Password</Text>
                                <View className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 h-14 flex-row items-center mb-8">
                                    <MaterialCommunityIcons name="lock-check-outline" size={20} color={isDark ? "#64748B" : "#94A3B8"} />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-900 dark:text-white font-medium"
                                        placeholder="Repeat new password"
                                        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                                        secureTextEntry
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                </View>

                                <View className="flex-row gap-4">
                                    <TouchableOpacity
                                        onPress={() => setModalVisible(false)}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 h-14 rounded-2xl items-center justify-center"
                                    >
                                        <Text className="text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-xs">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleChangePassword}
                                        disabled={loading}
                                        className="flex-[2] bg-blue-600 h-14 rounded-2xl items-center justify-center shadow-lg shadow-blue-200"
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className="text-white font-black uppercase tracking-widest text-xs">Update Password</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default PrivacyScreen;
