import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn, getCurrentUser } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shadow } from '../theme';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { setUser } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
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
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.content}>
                            {/* Brand Header */}
                            <View style={styles.header}>
                                <View style={styles.logoBadge}>
                                    <MaterialCommunityIcons name="heart-pulse" size={48} color={Colors.primary} />
                                </View>
                                <Text style={styles.appName}>Nurse Learning</Text>
                                <Text style={styles.subtitle}>Welcome back to your learning space</Text>
                            </View>

                            {/* Form Section */}
                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <View style={styles.inputContainer}>
                                        <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textLighter} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Email Address"
                                            placeholderTextColor={Colors.textLighter}
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.inputContainer}>
                                        <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.textLighter} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Password"
                                            placeholderTextColor={Colors.textLighter}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                            <MaterialCommunityIcons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={20}
                                                color={Colors.textLighter}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity style={styles.forgotBtn}>
                                        <Text style={styles.forgotText}>Forgot password?</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={Colors.white} size="small" />
                                    ) : (
                                        <Text style={styles.buttonText}>Sign In</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.linkText}>Create Account</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: Spacing.xxl,
    },
    content: {
        paddingHorizontal: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    logoBadge: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        ...Shadow.small,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textLight,
        marginTop: 6,
        textAlign: 'center',
    },
    form: {
        width: '100%',
        marginTop: Spacing.xl,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 52,
    },
    inputIcon: {
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
    },
    eyeIcon: {
        padding: 4,
    },
    forgotBtn: {
        paddingVertical: 8,
        alignSelf: 'flex-end',
    },
    forgotText: {
        color: Colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    button: {
        height: 52,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.lg,
        ...Shadow.small,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.xxl,
    },
    footerText: {
        fontSize: 14,
        color: Colors.textLight,
    },
    linkText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '700',
    },
});

export default LoginScreen;


