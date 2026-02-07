import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, useColorScheme } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

interface LoadingViewProps {
    fullScreen?: boolean;
    backgroundColor?: string;
    message?: string;
    size?: 'small' | 'large';
    color?: string;
}

const LoadingView: React.FC<LoadingViewProps> = ({
    fullScreen = true,
    backgroundColor,
    message,
    size = 'large',
    color
}) => {
    const isDark = useColorScheme() === 'dark';

    const containerStyle = [
        fullScreen ? styles.fullScreen : styles.container,
        { backgroundColor: backgroundColor || (fullScreen ? (isDark ? '#020617' : Colors.background) : 'transparent') }
    ];

    const spinnerColor = color || (isDark ? Colors.primaryLight : Colors.primary);

    return (
        <View style={containerStyle}>
            <ActivityIndicator size={size} color={spinnerColor} />
            {message && (
                <Text style={[styles.message, { color: isDark ? Colors.textSecondary : Colors.text }]}>
                    {message}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
    },
    container: {
        padding: Spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        ...Typography.body,
        marginTop: Spacing.md,
        fontWeight: '600',
    }
});

export default LoadingView;
