import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getFileUrl } from '../services/content';
import { ContentItem } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shadow } from '../theme';

const { width, height } = Dimensions.get('window');

const ContentDetailScreen = ({ route, navigation }: any) => {
    const { item }: { item: ContentItem } = route.params;
    const [loading, setLoading] = useState(true);
    const audioPlayer = useAudioPlayer(item.type === 'AUDIO' ? getFileUrl(item.storageFileId) : null);
    const videoPlayer = useVideoPlayer(item.type === 'VIDEO' ? getFileUrl(item.storageFileId) : null, (player) => {
        player.loop = false;
    });

    const status = useAudioPlayerStatus(audioPlayer);
    const isPlaying = status.playing;
    const duration = status.duration;
    const position = status.currentTime;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayAudio = () => {
        if (audioPlayer.playing) {
            audioPlayer.pause();
        } else {
            audioPlayer.play();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                {/* Custom Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color={Colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.typeTag}>
                            <Text style={styles.headerSubtitle}>{item.type}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.moreBtn}>
                        <MaterialCommunityIcons name="bookmark-outline" size={24} color={Colors.textLight} />
                    </TouchableOpacity>
                </View>

                {item.type === 'AUDIO' ? (
                    <View style={styles.audioContainer}>
                        <View style={styles.playerCard}>
                            <LinearGradient
                                colors={[Colors.primary, '#1e3a8a']}
                                style={styles.albumArt}
                            >
                                <MaterialCommunityIcons name="headphones" size={80} color={Colors.white} />
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.2)', 'transparent']}
                                    style={styles.artOverlay}
                                />
                            </LinearGradient>

                            <View style={styles.trackInfo}>
                                <Text style={styles.trackTitle} numberOfLines={2}>{item.title}</Text>
                                <Text style={styles.trackSubtitle} numberOfLines={2}>{item.description}</Text>
                            </View>

                            <View style={styles.waveformContainer}>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${(position / duration) * 100 || 0}%`,
                                                backgroundColor: Colors.primary
                                            }
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.progressThumb,
                                            {
                                                left: `${(position / duration) * 100 || 0}%`,
                                                backgroundColor: Colors.primary
                                            }
                                        ]}
                                    />
                                </View>
                                <View style={styles.timeRow}>
                                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                                </View>
                            </View>

                            <View style={styles.controls}>
                                <TouchableOpacity
                                    style={styles.controlBtnSmall}
                                    onPress={() => audioPlayer.seekBy(-10000)}
                                >
                                    <MaterialCommunityIcons name="rewind-10" size={32} color={Colors.text} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.playBtnLarge}
                                    onPress={handlePlayAudio}
                                    disabled={loading}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, '#1e40af']}
                                        style={styles.playBtnGradient}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color={Colors.white} size="small" />
                                        ) : (
                                            <MaterialCommunityIcons
                                                name={isPlaying ? "pause" : "play"}
                                                size={42}
                                                color={Colors.white}
                                                style={!isPlaying && { marginLeft: 4 }}
                                            />
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.controlBtnSmall}
                                    onPress={() => audioPlayer.seekBy(10000)}
                                >
                                    <MaterialCommunityIcons name="fast-forward-10" size={32} color={Colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : item.type === 'VIDEO' ? (
                    <View style={styles.videoContainer}>
                        <VideoView
                            player={videoPlayer}
                            style={styles.video}
                            contentFit="contain"
                            allowsFullscreen
                            allowsPictureInPicture
                        />
                        <View style={styles.videoInfo}>
                            <Text style={styles.videoTitle}>{item.title}</Text>
                            <Text style={styles.videoDesc}>{item.description}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.pdfContainer}>
                        <Pdf
                            source={{ uri: getFileUrl(item.storageFileId), cache: true }}
                            onLoadComplete={() => setLoading(false)}
                            onError={(error) => {
                                console.log(error);
                                Alert.alert('Error', 'Failed to load document');
                            }}
                            style={styles.pdf}
                            enablePaging={true}
                            horizontal={false}
                        />
                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.loadingText}>PREPARING DOCUMENT...</Text>
                            </View>
                        )}
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        zIndex: 10,
    },
    backBtn: {
        padding: 8,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    typeTag: {
        backgroundColor: Colors.background,
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 4,
        marginTop: 2,
    },
    headerSubtitle: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.textLighter,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    moreBtn: {
        padding: 8,
    },
    pdfContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    pdf: {
        flex: 1,
        width: width,
        height: height,
        backgroundColor: Colors.background,
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    video: {
        width: width,
        height: height * 0.35,
    },
    videoInfo: {
        padding: Spacing.xl,
        backgroundColor: Colors.white,
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -20,
    },
    videoTitle: {
        ...Typography.h2,
        color: Colors.text,
        marginBottom: 8,
    },
    videoDesc: {
        ...Typography.body,
        color: Colors.textLight,
        lineHeight: 22,
    },
    audioContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    playerCard: {
        backgroundColor: Colors.white,
        borderRadius: 40,
        padding: Spacing.xl,
        alignItems: 'center',
        ...Shadow.large,
    },
    albumArt: {
        width: width * 0.5,
        height: width * 0.5,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        position: 'relative',
        overflow: 'hidden',
        ...Shadow.medium,
    },
    artOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    trackInfo: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    trackTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    trackSubtitle: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: Spacing.md,
    },
    waveformContainer: {
        width: '100%',
        marginBottom: Spacing.xl,
    },
    progressBar: {
        height: 6,
        backgroundColor: Colors.background,
        borderRadius: 3,
        width: '100%',
        marginBottom: 12,
        position: 'relative',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressThumb: {
        position: 'absolute',
        top: -5,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: Colors.white,
        ...Shadow.small,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        fontSize: 12,
        color: Colors.textLighter,
        fontWeight: '700',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    controlBtnSmall: {
        padding: 10,
        opacity: 0.8,
    },
    playBtnLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        ...Shadow.medium,
    },
    playBtnGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.primary,
        marginTop: Spacing.lg,
        letterSpacing: 2,
    },
});

export default ContentDetailScreen;


