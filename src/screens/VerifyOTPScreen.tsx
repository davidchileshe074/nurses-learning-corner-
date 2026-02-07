import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendEmailOTP, verifyEmailOTP, getCurrentUser } from '../services/auth';
import { databases, APPWRITE_CONFIG } from '../services/appwriteClient';
import { useAuth } from '../context/AuthContext';
import { getDeviceId } from '../services/device';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const VerifyOTPScreen = ({ route, navigation }: any) => { // TODO: Add proper ScreenProps type
    const insets = useSafeAreaInsets();
    const { email: paramEmail } = route.params || {};
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [tempUserId, setTempUserId] = useState<string | null>(null);
    const { setUser, user } = useAuth();

    const email = user?.email || paramEmail;

    useEffect(() => {
        const sendCode = async () => {
            if (!email) return;
            try {
                const token = await sendEmailOTP(email, user?.$id || 'unique_temp_id');
                setTempUserId(token.userId);
            } catch (error: any) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to send verification code.'
                });
            }
        };
        sendCode();
    }, [email, user?.$id]);

    const handleVerify = async () => {
        if (code.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please enter the 6-digit code'
            });
            return;
        }

        setLoading(true);
        try {
            await verifyEmailOTP(tempUserId || user?.$id || 'current', code);
            const freshProfile = await getCurrentUser();
            const targetProfile = freshProfile || user;

            if (targetProfile?.$id) {
                const deviceId = await getDeviceId();
                await databases.updateDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.profilesCollectionId,
                    targetProfile.$id,
                    { verified: true, deviceId }
                );
                setUser({ ...targetProfile, verified: true, deviceId });
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Account verified successfully!'
                });
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Verification Failed',
                text2: 'Invalid code or expired session.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={{ paddingHorizontal: Spacing.xl, paddingTop: insets.top + Spacing.md }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 40,
                            height: 40,
                            marginLeft: -Spacing.sm,
                            marginBottom: Spacing.md,
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.text} />
                    </TouchableOpacity>

                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <View style={{ marginBottom: Spacing.xxl }}>
                            <Text style={{ ...Typography.h1, color: Colors.primary, marginBottom: 4 }}>Verify Email</Text>
                            <Text style={{ ...Typography.body, color: Colors.textSecondary }}>We've sent a 6-digit code to</Text>
                            <Text style={{ ...Typography.body, color: Colors.primary, fontWeight: '700' }}>{email}</Text>
                        </View>

                        <View style={{
                            backgroundColor: Colors.white,
                            padding: Spacing.lg,
                            borderRadius: BorderRadius.md,
                            borderWidth: 1,
                            borderColor: Colors.borderLight,
                            ...Shadow.medium,
                            alignItems: 'center'
                        }}>
                            <View style={{
                                width: 64,
                                height: 64,
                                backgroundColor: Colors.primaryLight,
                                borderRadius: BorderRadius.sm,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: Spacing.lg,
                                borderWidth: 1,
                                borderColor: Colors.primary
                            }}>
                                <MaterialCommunityIcons name="email-check-outline" size={32} color={Colors.primary} />
                            </View>

                            <TextInput
                                style={{
                                    width: '100%',
                                    backgroundColor: Colors.background,
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    borderRadius: BorderRadius.sm,
                                    padding: Spacing.md,
                                    fontSize: 32,
                                    textAlign: 'center',
                                    fontWeight: '700',
                                    color: Colors.text,
                                    marginBottom: Spacing.xs
                                }}
                                placeholder="000000"
                                placeholderTextColor={Colors.textMuted}
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                            <Text style={{ ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.xl }}>Enter the 6-digit code from your inbox</Text>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: Colors.primary,
                                    height: 48,
                                    width: '100%',
                                    borderRadius: BorderRadius.sm,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: loading ? 0.7 : 1
                                }}
                                onPress={handleVerify}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: Colors.white, fontWeight: '900' }}>VERIFY ACCOUNT</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setLoading(true);
                                    sendEmailOTP(email!, user?.$id || 'unique_temp_id')
                                        .then(() => Toast.show({
                                            type: 'success',
                                            text1: 'Sent',
                                            text2: 'A new code has been sent.'
                                        }))
                                        .finally(() => setLoading(false));
                                }}
                                style={{ marginTop: Spacing.lg }}
                            >
                                <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Didn't receive a code? <Text style={{ color: Colors.primary, fontWeight: '900' }}>RESEND</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default VerifyOTPScreen;

