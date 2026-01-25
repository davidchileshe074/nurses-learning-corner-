import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
const SupportScreen = ({ navigation }: any) => {

    const handleWhatsApp = () => {
        Linking.openURL('whatsapp://send?text=Hello, I need help with Nurse Learning Corner&phone=+260970000000');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@nurselearningcorner.com');
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View className="flex-row items-center px-6 py-4 border-b border-slate-100 bg-white">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900 ml-2">Help & Support</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                <View className="bg-blue-600 p-8 rounded-3xl mb-8 relative overflow-hidden">
                    <MaterialCommunityIcons
                        name="help-circle"
                        size={150}
                        color="rgba(255,255,255,0.1)"
                        style={{ position: 'absolute', right: -20, bottom: -40 }}
                    />
                    <Text className="text-white text-2xl font-black mb-2">How can we help?</Text>
                    <Text className="text-blue-100 font-medium">Our team is available 24/7 to assist you with any issues.</Text>
                </View>

                <Text className="text-slate-900 font-bold mb-4 ml-1">Contact Us</Text>

                <TouchableOpacity
                    onPress={handleWhatsApp}
                    className="bg-white p-5 rounded-2xl border border-slate-200 flex-row items-center mb-4 shadow-sm"
                >
                    <View className="w-10 h-10 bg-green-50 rounded-xl items-center justify-center">
                        <MaterialCommunityIcons name="whatsapp" size={24} color="#22C55E" />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-slate-800 font-bold">Chat on WhatsApp</Text>
                        <Text className="text-slate-500 text-xs">Fastest response time</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleEmail}
                    className="bg-white p-5 rounded-2xl border border-slate-200 flex-row items-center mb-4 shadow-sm"
                >
                    <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center">
                        <MaterialCommunityIcons name="email-outline" size={24} color="#2563EB" />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-slate-800 font-bold">Email Support</Text>
                        <Text className="text-slate-500 text-xs">For detailed inquiries</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
                </TouchableOpacity>

                <View className="bg-white p-6 rounded-3xl border border-slate-200 mt-4 mb-10">
                    <Text className="text-slate-900 font-bold mb-4">FAQ</Text>

                    <View className="mb-4">
                        <Text className="text-slate-800 font-bold text-sm mb-1">How do I redeem a code?</Text>
                        <Text className="text-slate-500 text-sm">Go to Account {'>'} Enter code in the Redeem section.</Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-slate-800 font-bold text-sm mb-1">Can I use multiple devices?</Text>
                        <Text className="text-slate-500 text-sm">For security reasons, your account is locked to the primary device you register with.</Text>
                    </View>

                    <View>
                        <Text className="text-slate-800 font-bold text-sm mb-1">How can I download content?</Text>
                        <Text className="text-slate-500 text-sm">Click the download icon on any study material to access it offline.</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SupportScreen;
