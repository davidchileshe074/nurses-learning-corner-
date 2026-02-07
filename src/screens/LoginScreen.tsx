import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signIn, getCurrentUser, sendPasswordResetEmail } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';
import LoadingView from '../components/LoadingView';

const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
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
                setUser(profile);
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
                text2: 'Password reset instructions sent.'
            });
            setForgotPasswordModalVisible(false);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to send reset email.'
            });
        } finally {
            setResetLoading(false);
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
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={{ flex: 1, justifyContent: 'center', paddingVertical: Spacing.xxl }}
                    >
                        {/* Brand Header */}
                        <View style={{ alignItems: 'center', marginBottom: Spacing.xxxl }}>
                            <View style={{
                                width: 80,
                                height: 80,
                                backgroundColor: Colors.primaryLight,
                                borderRadius: BorderRadius.sm,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 2,
                                borderColor: Colors.primary,
                                marginBottom: Spacing.md
                            }}>
                                <MaterialCommunityIcons name="heart-pulse" size={48} color={Colors.primary} />
                            </View>
                            <Text style={{ ...Typography.h1, color: Colors.primary }}>Nurse Learning</Text>
                            <Text style={{ ...Typography.body, color: Colors.textSecondary, textAlign: 'center' }}>Empowering nurses with digital tools</Text>
                        </View>

                        {/* Form Section */}
                        <View style={{
                            backgroundColor: Colors.white,
                            padding: Spacing.lg,
                            borderRadius: BorderRadius.md,
                            borderWidth: 1,
                            borderColor: Colors.borderLight,
                            ...Shadow.medium
                        }}>
                            <View style={{ marginBottom: Spacing.md }}>
                                <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>EMAIL ADDRESS</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    borderRadius: BorderRadius.sm,
                                    paddingHorizontal: Spacing.md,
                                    height: 48,
                                    backgroundColor: Colors.background
                                }}>
                                    <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textMuted} />
                                    <TextInput
                                        style={{ flex: 1, marginLeft: Spacing.sm, color: Colors.text, fontWeight: '500' }}
                                        placeholder="nurse@example.com"
                                        placeholderTextColor={Colors.textMuted}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={{ marginBottom: Spacing.sm }}>
                                <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>PASSWORD</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    borderRadius: BorderRadius.sm,
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

                            <TouchableOpacity
                                style={{ alignSelf: 'flex-end', marginBottom: Spacing.xl }}
                                onPress={() => setForgotPasswordModalVisible(true)}
                            >
                                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>FORGOT PASSWORD?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: Colors.primary,
                                    height: 48,
                                    borderRadius: BorderRadius.sm,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: loading ? 0.7 : 1
                                }}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: Colors.white, fontWeight: '900' }}>SIGN IN</Text>}
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl, alignSelf: 'center' }}>
                            <Text style={{ ...Typography.body, color: Colors.textSecondary }}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={{ color: Colors.primary, fontWeight: '900' }}>CREATE ONE</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Forgot Password Modal */}
            <Modal visible={forgotPasswordModalVisible} transparent={true} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg }}>
                    <View style={{
                        backgroundColor: Colors.white,
                        borderRadius: BorderRadius.sm,
                        overflow: 'hidden',
                        ...Shadow.medium
                    }}>
                        <View style={{ padding: Spacing.md, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: Colors.white, fontWeight: '700' }}>Recover Account</Text>
                            <TouchableOpacity onPress={() => setForgotPasswordModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={20} color={Colors.white} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ padding: Spacing.lg }}>
                            <Text style={{ ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg }}>
                                Enter your verified email address and we'll send you instructions to reset your password.
                            </Text>

                            <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>EMAIL ADDRESS</Text>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: Colors.border,
                                borderRadius: BorderRadius.xs,
                                paddingHorizontal: Spacing.md,
                                height: 48,
                                marginBottom: Spacing.xl
                            }}>
                                <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textMuted} />
                                <TextInput
                                    style={{ flex: 1, marginLeft: Spacing.sm, color: Colors.text }}
                                    placeholder="nurse@example.com"
                                    value={resetEmail}
                                    onChangeText={setResetEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: Colors.primary,
                                    height: 48,
                                    borderRadius: BorderRadius.xs,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onPress={handleForgotPassword}
                                disabled={resetLoading}
                            >
                                {resetLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: Colors.white, fontWeight: '900' }}>SEND RESET LINK</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default LoginScreen;

