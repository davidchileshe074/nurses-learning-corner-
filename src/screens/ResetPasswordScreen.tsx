import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { account } from '../services/appwriteClient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const ResetPasswordScreen = ({ route, navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { userId, secret } = route.params || {};
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
                text1: 'Success',
                text2: 'Password reset successful. Please log in.'
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
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    style={{ paddingHorizontal: Spacing.xl }}
                >
                    <Animated.View entering={FadeInDown.delay(100).springify()} style={{ flex: 1, justifyContent: 'center', paddingVertical: 40 }}>
                        <View style={{ alignItems: 'center', marginBottom: 48 }}>
                            <View style={{
                                width: 80,
                                height: 80,
                                backgroundColor: Colors.primaryLight,
                                borderRadius: BorderRadius.xs,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 2,
                                borderColor: Colors.primary,
                                marginBottom: Spacing.md
                            }}>
                                <MaterialCommunityIcons name="lock-reset" size={48} color={Colors.primary} />
                            </View>
                            <Text style={{ ...Typography.h1, color: Colors.primary }}>New Password</Text>
                            <Text style={{ ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 }}>Create a secure password for your account</Text>
                        </View>

                        <View style={{
                            backgroundColor: Colors.white,
                            padding: Spacing.lg,
                            borderRadius: BorderRadius.sm,
                            borderWidth: 1,
                            borderColor: Colors.borderLight,
                            ...Shadow.medium
                        }}>
                            <View style={{ marginBottom: Spacing.md }}>
                                <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>NEW PASSWORD</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    borderRadius: BorderRadius.xs,
                                    paddingHorizontal: Spacing.md,
                                    height: 48,
                                    backgroundColor: Colors.background
                                }}>
                                    <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.textMuted} />
                                    <TextInput
                                        style={{ flex: 1, marginLeft: Spacing.sm, color: Colors.text, fontWeight: '500' }}
                                        placeholder="Min 8 characters"
                                        placeholderTextColor={Colors.textMuted}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <MaterialCommunityIcons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color={Colors.textMuted}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ marginBottom: Spacing.xl }}>
                                <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>CONFIRM PASSWORD</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    borderRadius: BorderRadius.xs,
                                    paddingHorizontal: Spacing.md,
                                    height: 48,
                                    backgroundColor: Colors.background
                                }}>
                                    <MaterialCommunityIcons name="lock-check-outline" size={20} color={Colors.textMuted} />
                                    <TextInput
                                        style={{ flex: 1, marginLeft: Spacing.sm, color: Colors.text, fontWeight: '500' }}
                                        placeholder="Repeat password"
                                        placeholderTextColor={Colors.textMuted}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: Colors.primary,
                                    height: 48,
                                    borderRadius: BorderRadius.xs,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: loading ? 0.7 : 1
                                }}
                                onPress={handleResetPassword}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: Colors.white, fontWeight: '900' }}>RESET PASSWORD</Text>}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={{ alignSelf: 'center', marginTop: 32 }}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={{ color: Colors.primary, fontWeight: '900' }}>BACK TO LOGIN</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ResetPasswordScreen;


