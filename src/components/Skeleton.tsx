import React, { useEffect } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence
} from 'react-native-reanimated';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    style?: StyleProp<ViewStyle>;
    borderRadius?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    style,
    borderRadius = 8
}) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height: height as any,
                    backgroundColor: '#CBD5E1', // slate-300
                    borderRadius
                },
                style,
                animatedStyle
            ]}
        />
    );
};

export default Skeleton;
