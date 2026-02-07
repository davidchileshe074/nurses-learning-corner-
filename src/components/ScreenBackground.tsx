import React from 'react';
import { View, StyleSheet } from 'react-native';

const ScreenBackground = () => {
    return (
        <View style={StyleSheet.absoluteFill} className="opacity-30 dark:opacity-10 pointer-events-none z-0">
            <View className="absolute top-0 right-[-100] w-[300] h-[300] bg-blue-400 rounded-full blur-[100px]" />
            <View className="absolute top-[40%] left-[-100] w-[300] h-[300] bg-indigo-400 rounded-full blur-[100px]" />
            <View className="absolute bottom-[-50] right-[-50] w-[200] h-[200] bg-sky-400 rounded-full blur-[100px]" />
        </View>
    );
};

export default ScreenBackground;
