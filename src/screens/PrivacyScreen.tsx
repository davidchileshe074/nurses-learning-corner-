import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { changePassword, deleteAccount } from '../services/auth';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const { height } = Dimensions.get('window');

const PrivacyScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
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
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar style="light" backgroundColor={Colors.primaryDark} />

            {/* Toolbar */}
            <View style={{
                paddingTop: insets.top,
                backgroundColor: Colors.primary,
                ...Shadow.small,
                zIndex: 100
            }}>
                <View style={{
                    height: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: Spacing.md
                }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: Spacing.md }}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }}>Privacy & Security</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.md }} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <View style={{
                        backgroundColor: Colors.white,
                        padding: Spacing.lg,
                        borderRadius: BorderRadius.md,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        marginBottom: Spacing.lg,
                        ...Shadow.small
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
                            <View style={{
                                width: 44,
                                height: 44,
                                backgroundColor: Colors.successLight,
                                borderRadius: BorderRadius.sm,
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <MaterialCommunityIcons name="shield-check" size={24} color={Colors.success} />
                            </View>
                            <View style={{ marginLeft: Spacing.md }}>
                                <Text style={{ ...Typography.h3 }}>Secure Platform</Text>
                                <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>Personal data is encrypted</Text>
                            </View>
                        </View>

                        <Text style={{ ...Typography.body, fontWeight: '700', marginBottom: 4 }}>Privacy Policy</Text>
                        <Text style={{ ...Typography.caption, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md }}>
                            At Nurse Learning Corner, we are committed to protecting your privacy. We only collect necessary information to provide you with the best educational experience.
                        </Text>

                        <View style={{ gap: Spacing.sm }}>
                            <Text style={{ ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 }}>
                                • <Text style={{ fontWeight: '700', color: Colors.text }}>Information Collection:</Text> We collect your name, email, and academic details to personalize your learning journey.
                            </Text>
                            <Text style={{ ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 }}>
                                • <Text style={{ fontWeight: '700', color: Colors.text }}>Data Usage:</Text> Your data is used exclusively for app functionality and is never shared with third parties.
                            </Text>
                            <Text style={{ ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 }}>
                                • <Text style={{ fontWeight: '700', color: Colors.text }}>Device Security:</Text> Accounts are linked to your device to ensure content security.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setModalVisible(true)}
                        style={{
                            backgroundColor: Colors.white,
                            padding: Spacing.md,
                            borderRadius: BorderRadius.sm,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: Spacing.sm,
                            ...Shadow.small
                        }}
                    >
                        <MaterialCommunityIcons name="lock-reset" size={22} color={Colors.primary} />
                        <Text style={{ flex: 1, marginLeft: Spacing.md, fontWeight: '600' }}>Change Password</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleDeleteAccount}
                        style={{
                            backgroundColor: Colors.white,
                            padding: Spacing.md,
                            borderRadius: BorderRadius.sm,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: Spacing.xl,
                            ...Shadow.small
                        }}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.error} />
                        <Text style={{ flex: 1, marginLeft: Spacing.md, fontWeight: '600', color: Colors.error }}>Delete Account</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.border} />
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={{
                            backgroundColor: Colors.white,
                            borderTopLeftRadius: BorderRadius.md,
                            borderTopRightRadius: BorderRadius.md,
                            overflow: 'hidden',
                            maxHeight: height * 0.8
                        }}>
                            <View style={{ padding: Spacing.md, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ color: Colors.white, fontWeight: '700' }}>Update Password</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Keep your account secure</Text>
                                </View>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={20} color={Colors.white} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ padding: Spacing.lg }} keyboardShouldPersistTaps="handled">
                                <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>CURRENT PASSWORD</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    borderRadius: BorderRadius.sm,
                                    paddingHorizontal: Spacing.md,
                                    height: 48,
                                    marginBottom: Spacing.md
                                }}>
                                    <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.textMuted} />
                                    <TextInput
                                        style={{ flex: 1, marginLeft: Spacing.sm, color: Colors.text }}
                                        placeholder="Enter current password"
                                        secureTextEntry
                                        value={oldPassword}
                                        onChangeText={setOldPassword}
                                    />
                                </View>

                                <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>NEW PASSWORD</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    borderRadius: BorderRadius.sm,
                                    paddingHorizontal: Spacing.md,
                                    height: 48,
                                    marginBottom: Spacing.md
                                }}>
                                    <MaterialCommunityIcons name="lock-reset" size={18} color={Colors.textMuted} />
                                    <TextInput
                                        style={{ flex: 1, marginLeft: Spacing.sm, color: Colors.text }}
                                        placeholder="At least 8 characters"
                                        secureTextEntry
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                </View>

                                <Text style={{ ...Typography.label, marginBottom: Spacing.xs }}>CONFIRM NEW PASSWORD</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: Colors.border,
                                    borderRadius: BorderRadius.sm,
                                    paddingHorizontal: Spacing.md,
                                    height: 48,
                                    marginBottom: Spacing.xl
                                }}>
                                    <MaterialCommunityIcons name="lock-check-outline" size={18} color={Colors.textMuted} />
                                    <TextInput
                                        style={{ flex: 1, marginLeft: Spacing.sm, color: Colors.text }}
                                        placeholder="Repeat new password"
                                        secureTextEntry
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleChangePassword}
                                    disabled={loading}
                                    style={{
                                        backgroundColor: Colors.primary,
                                        height: 48,
                                        borderRadius: BorderRadius.sm,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: insets.bottom + Spacing.xl
                                    }}
                                >
                                    {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: Colors.white, fontWeight: '700' }}>UPDATE PASSWORD</Text>}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
};

export default PrivacyScreen;

