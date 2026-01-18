import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Program, YearOfStudy } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shadow } from '../theme';

const RegisterScreen = ({ navigation }: any) => {
    const { setUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy>('YEAR1');
    const [program, setProgram] = useState<Program>('G-NURSING');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Program options with display labels
    const programs: { value: Program; label: string }[] = [
        { value: 'G-NURSING', label: 'General Nursing' },
        { value: 'MIDWIFERY', label: 'Midwifery' },
        { value: 'PUBLIC-HEALTH', label: 'Public Health Nursing' },
        { value: 'MENTAL-HEALTH', label: 'Mental Health Nursing' },
    ];

    // Year options with display labels
    const years: { label: string; value: YearOfStudy }[] = [
        { label: 'Year 1', value: 'YEAR1' },
        { label: 'Year 2', value: 'YEAR2' },
        { label: 'Year 3', value: 'YEAR3' },
    ];

    const handleRegister = async () => {
        if (!email || !password || !fullName || !whatsappNumber) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        try {
            const profile = await signUp(email, password, fullName, whatsappNumber, yearOfStudy, program);
            Alert.alert('Success', 'Account created! Please verify your email address.');
            setUser(profile as any);
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
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
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                                <MaterialCommunityIcons name="chevron-left" size={32} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.title}>Register</Text>
                            <Text style={styles.subtitle}>Join our community of professionals</Text>
                        </View>

                        <View style={styles.formSection}>
                            {/* Personal Info */}
                            <Text style={styles.sectionLabel}>Identification</Text>

                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="account-outline" size={20} color={Colors.textLighter} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor={Colors.textLighter}
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>

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

                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="whatsapp" size={20} color={Colors.textLighter} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="WhatsApp Number"
                                    placeholderTextColor={Colors.textLighter}
                                    value={whatsappNumber}
                                    onChangeText={setWhatsappNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Academic Info */}
                            <Text style={styles.sectionLabel}>Academic Path</Text>

                            <View style={styles.pickerSection}>
                                <Text style={styles.pickerLabel}>Year of Study</Text>
                                <View style={styles.chipRow}>
                                    {years.map((y) => (
                                        <TouchableOpacity
                                            key={y.value}
                                            style={[styles.chip, yearOfStudy === y.value && styles.chipActive]}
                                            onPress={() => setYearOfStudy(y.value)}
                                        >
                                            <Text style={[styles.chipText, yearOfStudy === y.value && styles.chipTextActive]}>{y.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.pickerSection}>
                                <Text style={styles.pickerLabel}>Program</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                    {programs.map((p) => (
                                        <TouchableOpacity
                                            key={p.value}
                                            style={[styles.programChip, program === p.value && styles.chipActive]}
                                            onPress={() => setProgram(p.value)}
                                        >
                                            <Text style={[styles.chipText, program === p.value && styles.chipTextActive]}>{p.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Security */}
                            <Text style={styles.sectionLabel}>Security</Text>
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
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <MaterialCommunityIcons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color={Colors.textLighter}
                                    />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color={Colors.white} size="small" />
                                ) : (
                                    <Text style={styles.buttonText}>Register</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Found your account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.linkText}>Sign In</Text>
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
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
        ...Shadow.small,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textLight,
        marginTop: 6,
    },
    formSection: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textLighter,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: Spacing.md,
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
    pickerSection: {
        marginTop: Spacing.xs,
    },
    pickerLabel: {
        fontSize: 14,
        color: Colors.text,
        marginBottom: 8,
        fontWeight: '600',
    },
    chipRow: {
        flexDirection: 'row',
        gap: 12,
    },
    chipScroll: {
        flexDirection: 'row',
    },
    chip: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    programChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: 10,
    },
    chipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '600',
    },
    chipTextActive: {
        color: Colors.white,
        fontWeight: '700',
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
        marginTop: Spacing.lg,
        paddingBottom: Spacing.xl,
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

export default RegisterScreen;


