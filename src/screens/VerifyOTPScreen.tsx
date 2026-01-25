import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendEmailOTP, verifyEmailOTP, getCurrentUser } from '../services/auth';
import { databases, APPWRITE_CONFIG } from '../services/appwriteClient';
import { useAuth } from '../context/AuthContext';
import { getDeviceId } from '../services/device';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
                const token = await sendEmailOTP(email, user?.$id || 'unique_temp_id');
                setTempUserId(token.userId);
            } catch (error: any) {
                Alert.alert('Error', 'Failed to send verification code. ' + error.message);
            }
        };
        sendCode();
    }, [email, user?.$id]);

    const handleVerify = async () => {
        if (code.length < 6) {
            Alert.alert('Error', 'Please enter the 6-digit code');
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
                Alert.alert('Success', 'Account verified successfully!');
            }
        } catch (error: any) {
            Alert.alert('Verification Failed', 'Invalid code or expired session.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 p-6">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mb-8">
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
                </TouchableOpacity>

                <View className="mb-10">
                    <Text className="text-3xl font-bold text-slate-900 mb-2">Verify Email</Text>
                    <Text className="text-slate-600 text-lg">We've sent a 6-digit code to</Text>
                    <Text className="text-blue-600 font-bold text-lg">{email}</Text>
                </View>

                <View className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <View className="mb-8 items-center">
                        <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
                            <MaterialCommunityIcons name="email-check-outline" size={32} color="#2563EB" />
                        </View>
                    </View>

                    <TextInput
                        className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5 text-4xl text-center font-bold text-slate-900 mb-2"
                        placeholder="000000"
                        placeholderTextColor="#94A3B8"
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        maxLength={6}
                    />
                    <Text className="text-slate-400 text-center text-sm mb-8">Enter the code from your email</Text>

                    <TouchableOpacity
                        onPress={handleVerify}
                        disabled={loading}
                        className={`bg-blue-600 h-14 rounded-lg items-center justify-center shadow-md ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg uppercase tracking-wider">Verify Account</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setLoading(true);
                            sendEmailOTP(email!, user?.$id || 'unique_temp_id')
                                .then(() => Alert.alert('Sent', 'A new code has been sent.'))
                                .finally(() => setLoading(false));
                        }}
                        className="mt-6 items-center"
                    >
                        <Text className="text-slate-600">Didn't receive a code? <Text className="text-blue-600 font-bold">Resend</Text></Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default VerifyOTPScreen;

