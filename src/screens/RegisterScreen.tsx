import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signUp } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Program, YearOfStudy } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const RegisterScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
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
        { value: 'PUBLIC-HEALTH', label: 'Public Health Nursing' },
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
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View entering={FadeInDown.duration(600).springify()} style={{ paddingHorizontal: Spacing.xl }}>
                        {/* Header */}
                        <View style={{ paddingTop: insets.top + Spacing.md, marginBottom: Spacing.lg }}>
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
                            <Text style={{ ...Typography.h1, color: Colors.primary }}>Create Account</Text>
                            <Text style={{ ...Typography.body, color: Colors.textSecondary, marginTop: 4 }}>Join us to access specialized nursing curriculum.</Text>
                        </View>

                        {/* Personal Info */}
                        <View style={{ marginBottom: Spacing.xl }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 11, letterSpacing: 1.2 }}>PERSONAL DETAILS</Text>
                                <View style={{ flex: 1, height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.md }} />
                            </View>

                            <View style={{ gap: Spacing.md }}>
                                <View>
                                    <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>FULL NAME</Text>
                                    <TextInput
                                        style={{
                                            height: 48,
                                            borderWidth: 1,
                                            borderColor: Colors.border,
                                            borderRadius: BorderRadius.sm,
                                            paddingHorizontal: Spacing.md,
                                            backgroundColor: Colors.background,
                                            color: Colors.text,
                                            fontWeight: '500'
                                        }}
                                        placeholder="e.g. Sarah Phiri"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>

                                <View>
                                    <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>EMAIL ADDRESS</Text>
                                    <TextInput
                                        style={{
                                            height: 48,
                                            borderWidth: 1,
                                            borderColor: Colors.border,
                                            borderRadius: BorderRadius.sm,
                                            paddingHorizontal: Spacing.md,
                                            backgroundColor: Colors.background,
                                            color: Colors.text,
                                            fontWeight: '500'
                                        }}
                                        placeholder="student@example.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View>
                                    <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>WHATSAPP NUMBER</Text>
                                    <TextInput
                                        style={{
                                            height: 48,
                                            borderWidth: 1,
                                            borderColor: Colors.border,
                                            borderRadius: BorderRadius.sm,
                                            paddingHorizontal: Spacing.md,
                                            backgroundColor: Colors.background,
                                            color: Colors.text,
                                            fontWeight: '500'
                                        }}
                                        placeholder="+260 97..."
                                        value={whatsappNumber}
                                        onChangeText={setWhatsappNumber}
                                        keyboardType="phone-pad"
                                    />
                                </View>

                                <View>
                                    <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>PASSWORD</Text>
                                    <View style={{
                                        height: 48,
                                        borderWidth: 1,
                                        borderColor: Colors.border,
                                        borderRadius: BorderRadius.sm,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: Colors.background,
                                        paddingHorizontal: Spacing.md
                                    }}>
                                        <TextInput
                                            style={{ flex: 1, color: Colors.text, fontWeight: '500' }}
                                            placeholder="Min 8 characters"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} color={Colors.textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Academic Profile */}
                        <View style={{ marginBottom: Spacing.xl }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 11, letterSpacing: 1.2 }}>ACADEMIC PROFILE</Text>
                                <View style={{ flex: 1, height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.md }} />
                            </View>

                            <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>YEAR OF STUDY</Text>
                            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
                                {years.map((y) => (
                                    <TouchableOpacity
                                        key={y.value}
                                        onPress={() => setYearOfStudy(y.value)}
                                        style={{
                                            flex: 1,
                                            height: 40,
                                            borderRadius: BorderRadius.sm,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 1,
                                            borderColor: yearOfStudy === y.value ? Colors.primary : Colors.border,
                                            backgroundColor: yearOfStudy === y.value ? Colors.primary : Colors.white
                                        }}
                                    >
                                        <Text style={{ fontWeight: '700', fontSize: 12, color: yearOfStudy === y.value ? Colors.white : Colors.textSecondary }}>{y.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>NURSING PROGRAM</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                                {programs.map((p) => (
                                    <TouchableOpacity
                                        key={p.value}
                                        onPress={() => setProgram(p.value)}
                                        style={{
                                            paddingHorizontal: Spacing.md,
                                            paddingVertical: 8,
                                            borderRadius: BorderRadius.sm,
                                            borderWidth: 1,
                                            borderColor: program === p.value ? Colors.primary : Colors.border,
                                            backgroundColor: program === p.value ? Colors.primaryLight : Colors.white
                                        }}
                                    >
                                        <Text style={{ fontWeight: '600', fontSize: 11, color: program === p.value ? Colors.primary : Colors.textSecondary }}>{p.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={loading}
                            style={{
                                backgroundColor: Colors.primary,
                                height: 48,
                                borderRadius: BorderRadius.sm,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: Spacing.lg
                            }}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: Colors.white, fontWeight: '900' }}>CREATE ACCOUNT</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            style={{ alignSelf: 'center', marginTop: Spacing.xl }}
                        >
                            <Text style={{ color: Colors.textSecondary }}>Already have an account? <Text style={{ color: Colors.primary, fontWeight: '900' }}>SIGN IN</Text></Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default RegisterScreen;

