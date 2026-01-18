import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendEmailOTP, verifyEmailOTP, getCurrentUser } from '../services/auth';
import { databases, APPWRITE_CONFIG } from '../services/appwriteClient';
import { useAuth } from '../context/AuthContext';
import { getDeviceId, bindDeviceToProfile } from '../services/device';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shadow } from '../theme';

const VerifyOTPScreen = ({ route, navigation }: any) => {
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
                // If user is logged in, use their ID, otherwise use ID.unique()
                const token = await sendEmailOTP(email, user?.$id || 'unique_temp_id');
                setTempUserId(token.userId);
            } catch (error: any) {
                Alert.alert('Error', 'Failed to send verification code to email. ' + error.message);
            }
        };
        sendCode();
    }, [email, user?.$id]);

    const handleVerify = async () => {
        if (code.length < 6) {
            Alert.alert('Error', 'Please enter the 6-digit code');
            return;
        }

        if (!tempUserId && !user?.$id) {
            Alert.alert('Error', 'Session not initialized. Please try again.');
            return;
        }

        setLoading(true);
        try {
            await verifyEmailOTP(tempUserId || user?.$id || 'current', code);

            // Fetch fresh account info after session creation
            const freshProfile = await getCurrentUser();
            const targetProfile = freshProfile || user;

            if (targetProfile?.$id) {
                const deviceId = await getDeviceId();
                // Update profile in database
                await databases.updateDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.profilesCollectionId,
                    targetProfile.$id,
                    { verified: true, deviceId }
                );

                setUser({ ...targetProfile, verified: true, deviceId });
            }

            Alert.alert('Success', 'Email verified!');
        } catch (error: any) {
            Alert.alert('Verification Failed', 'Invalid code or expired session. ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <LinearGradient
                colors={[Colors.primary, '#1e3a8a']}
                style={styles.backgroundGradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.keyboardView}
                    >
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Text style={styles.title}>Verify Account</Text>
                            <Text style={styles.subtitle}>Check your email for the verification code</Text>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.iconWrapper}>
                                <LinearGradient
                                    colors={[`${Colors.primary}20`, `${Colors.primary}10`]}
                                    style={styles.iconCircle}
                                >
                                    <MaterialCommunityIcons name="email-lock" size={40} color={Colors.primary} />
                                </LinearGradient>
                            </View>

                            <View style={styles.infoSection}>
                                <Text style={styles.infoText}>
                                    A 6-digit code was sent to
                                </Text>
                                <Text style={styles.emailText}>{email}</Text>
                            </View>

                            <View style={styles.inputSection}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="000000"
                                    placeholderTextColor={Colors.border}
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                                <Text style={styles.hint}>Expires in 10 minutes</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleVerify}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, '#1e40af']}
                                    style={styles.btnGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={Colors.white} size="small" />
                                    ) : (
                                        <View style={styles.btnContent}>
                                            <MaterialCommunityIcons name="shield-check" size={20} color={Colors.white} />
                                            <Text style={styles.buttonText}>VERIFY NOW</Text>
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.resendBtn}
                                onPress={() => {
                                    setLoading(true);
                                    sendEmailOTP(email!, user?.$id || 'unique_temp_id')
                                        .then(() => Alert.alert('Sent', 'A new code has been sent to your email.'))
                                        .finally(() => setLoading(false));
                                }}
                            >
                                <Text style={styles.resendText}>Didn't receive a code? <Text style={styles.resendLink}>Resend</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
    },
    backgroundGradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.lg,
        marginLeft: Spacing.xl,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.white,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    card: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: Spacing.xl,
        flex: 1,
        ...Shadow.large,
    },
    iconWrapper: {
        alignItems: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.xl,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    infoText: {
        fontSize: 15,
        color: Colors.textLight,
        fontWeight: '500',
    },
    emailText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '800',
        marginTop: 4,
    },
    inputSection: {
        marginBottom: Spacing.xl,
    },
    input: {
        backgroundColor: Colors.background,
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: 20,
        padding: Spacing.lg,
        fontSize: 38,
        textAlign: 'center',
        fontWeight: '900',
        letterSpacing: 10,
        color: Colors.primary,
    },
    hint: {
        fontSize: 13,
        color: Colors.textLighter,
        textAlign: 'center',
        marginTop: Spacing.md,
        fontWeight: '600',
    },
    button: {
        height: 58,
        borderRadius: 18,
        overflow: 'hidden',
        ...Shadow.medium,
    },
    btnGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    resendBtn: {
        marginTop: Spacing.xl,
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
    },
    resendLink: {
        color: Colors.primary,
        fontWeight: '800',
    }
});

export default VerifyOTPScreen;

