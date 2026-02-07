import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    Modal,
    Pressable,
    Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { getFileUrl } from '../services/content';
import { downloadContent, savePlaybackPosition, getPlaybackPosition, getLocalContentUri } from '../services/downloads';
import { ContentItem } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { addToRecent } from '../services/recent';
import { useAuth } from '../context/AuthContext';
import { notesService } from '../services/notes';
import { useIsFocused } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';
import LoadingView from '../components/LoadingView';

const { width, height } = Dimensions.get('window');

const ContentDetailScreen = ({ route, navigation }: any) => {
    const { item }: { item: ContentItem } = route.params;
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [contentUri, setContentUri] = useState<string>(getFileUrl(item.storageFileId));

    const [initialPage, setInitialPage] = useState(1);
    const { user } = useAuth();
    const [noteText, setNoteText] = useState('');
    const [isNotesVisible, setIsNotesVisible] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);

    // Resume Modal State
    const [isResumeModalVisible, setIsResumeModalVisible] = useState(false);
    const [savedPos, setSavedPos] = useState(0);
    const [readyToRender, setReadyToRender] = useState(false);
    const isFocused = useIsFocused();
    const [shouldMountPdf, setShouldMountPdf] = useState(false);

    // Robust type normalization for document identification
    const normalizedType = useMemo(() => item.type?.toUpperCase().replace(/\s+/g, '_') || 'PDF', [item.type]);
    const isPdfType = useMemo(() => ['PDF', 'PAST_PAPER', 'MARKING_KEY', 'MATERIAL'].includes(normalizedType), [normalizedType]);

    // Unified Initialization Logic
    useEffect(() => {
        const init = async () => {
            // Track as recent immediately
            addToRecent(item);

            try {
                // Parallelize all initialization checks
                const [local, savedPosition, note] = await Promise.all([
                    getLocalContentUri(item.$id),
                    getPlaybackPosition(item.$id),
                    user ? notesService.getNote(item.$id, user.userId) : Promise.resolve(null)
                ]);

                // 1. Set Local Status
                if (local) {
                    setContentUri(local);
                    setIsDownloaded(true);
                } else {
                    setIsDownloaded(false);
                }

                // 2. Set Notes
                if (note) setNoteText(note.text);
                if (route.params?.autoOpenNotes) setIsNotesVisible(true);

                // 3. Set Position
                setSavedPos(savedPosition);

                // 4. Determine if we should show Resume Modal
                const shouldPrompt = isPdfType && savedPosition >= 1;

                if (shouldPrompt) {
                    setIsResumeModalVisible(true);
                } else {
                    setReadyToRender(true);
                    if (!isPdfType) {
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error('[ContentDetail] Init Error:', error);
                setReadyToRender(true);
                setLoading(false);
            }
        };

        init();
    }, [item.$id, user]);

    // Android-specific PDF mount delay
    useEffect(() => {
        let timer: any;
        if (isFocused && readyToRender && !isResumeModalVisible && isPdfType) {
            timer = setTimeout(() => setShouldMountPdf(true), 500);
        } else {
            setShouldMountPdf(false);
        }
        return () => {
            if (timer) clearTimeout(timer);
            setShouldMountPdf(false);
        };
    }, [isFocused, readyToRender, isResumeModalVisible, isPdfType]);

    const handleResume = (shouldResume: boolean) => {
        if (shouldResume) {
            setInitialPage(savedPos);
        } else {
            setInitialPage(1);
        }
        setIsResumeModalVisible(false);
        setReadyToRender(true);
        if (!isPdfType) {
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!user) return;
        setSavingNote(true);
        const success = await notesService.saveNote(item.$id, user.userId, noteText);
        setSavingNote(false);
        if (success) {
            Toast.show({
                type: 'success',
                text1: 'Note Saved'
            });
            setTimeout(() => {
                setIsNotesVisible(false);
            }, 500);
        }
    };


    const handleOpenInBrowser = async () => {
        try {
            const remoteUrl = getFileUrl(item.storageFileId);
            const canOpen = await Linking.canOpenURL(remoteUrl);
            if (canOpen) {
                await Linking.openURL(remoteUrl);
            } else {
                throw new Error('Cannot open URL');
            }
        } catch (error) {
            console.error('[Linking Error]', error);
            Toast.show({
                type: 'error',
                text1: 'Link Error'
            });
        }
    };

    const pdfSource = useMemo(() => {
        if (!contentUri) return null;
        return {
            uri: contentUri,
            cache: true,
            fileType: 'pdf'
        };
    }, [contentUri]);

    const handlePdfPageChange = useCallback((page: number) => {
        savePlaybackPosition(item.$id, page);
    }, [item.$id]);

    const handlePdfError = useCallback((error: any) => {
        console.log('[PDF Error]', error);
        Toast.show({
            type: 'error',
            text1: 'Error loading document'
        });
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        const success = await downloadContent(
            item.$id,
            item.title,
            item.type,
            item.storageFileId,
            item.subject,
            item.program,
            item.yearOfStudy
        );
        setDownloading(false);
        if (success) {
            Toast.show({
                type: 'success',
                text1: 'Saved for offline study'
            });
            setIsDownloaded(true);
        } else {
            Toast.show({
                type: 'error',
                text1: 'Download Failed'
            });
        }
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
                        <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase' }}>{item.type.replace('_', ' ')}</Text>
                    </View>

                    {!isDownloaded ? (
                        <TouchableOpacity
                            onPress={handleDownload}
                            disabled={downloading}
                            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                        >
                            {downloading ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <MaterialCommunityIcons name="cloud-download-outline" size={24} color={Colors.white} />
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name="check-decagram-outline" size={24} color={Colors.success} />
                        </View>
                    )}
                </View>
            </View>

            <View style={{ flex: 1 }}>
                {(!readyToRender || isResumeModalVisible) ? (
                    <LoadingView message="Preparing study material..." />
                ) : (
                    item.type === 'LINK' ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
                            <MaterialCommunityIcons name="link-variant" size={64} color={Colors.primary} />
                            <Text style={{ ...Typography.h2, textAlign: 'center', marginTop: Spacing.lg }}>External Resource</Text>
                            <Text style={{ ...Typography.body, textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.md, marginBottom: Spacing.xl }}>
                                This material is hosted on an external portal. Click the button below to view it.
                            </Text>
                            <TouchableOpacity
                                onPress={handleOpenInBrowser}
                                style={{
                                    backgroundColor: Colors.primary,
                                    width: '100%',
                                    height: 52,
                                    borderRadius: BorderRadius.sm,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Text style={{ color: Colors.white, fontWeight: '700', textTransform: 'uppercase' }}>Open Link</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            {shouldMountPdf && pdfSource && (
                                <Pdf
                                    key={`pdf-${item.$id}-${initialPage}`}
                                    source={pdfSource}
                                    page={initialPage}
                                    trustAllCerts={false}
                                    onLoadComplete={() => setLoading(false)}
                                    onPageChanged={handlePdfPageChange}
                                    onError={handlePdfError}
                                    style={{
                                        flex: 1,
                                        width: width,
                                        height: height,
                                        backgroundColor: Colors.background
                                    }}
                                    enablePaging={true}
                                />
                            )}
                            {loading && (
                                <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)' }}>
                                    <LoadingView fullScreen={false} message="Decrypting content..." />
                                </View>
                            )}
                        </View>
                    )
                )}
            </View>

            {/* Floating Note Button */}
            {!isNotesVisible && (
                <TouchableOpacity
                    onPress={() => setIsNotesVisible(true)}
                    style={{
                        position: 'absolute',
                        bottom: 24,
                        right: 24,
                        width: 56,
                        height: 56,
                        backgroundColor: Colors.primary,
                        borderRadius: BorderRadius.full,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...Shadow.medium,
                        zIndex: 200
                    }}
                >
                    <MaterialCommunityIcons name="notebook-edit-outline" size={24} color={Colors.white} />
                    {noteText.length > 0 && (
                        <View style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, backgroundColor: Colors.success, borderRadius: 7, borderWidth: 2, borderColor: Colors.white }} />
                    )}
                </TouchableOpacity>
            )}

            {/* Notes Modal */}
            <Modal visible={isNotesVisible} transparent={true} animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.md, borderTopRightRadius: BorderRadius.md, overflow: 'hidden' }}>
                            <View style={{ padding: Spacing.md, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ color: Colors.white, fontWeight: '700' }}>Study Notes</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Personal reflections</Text>
                                </View>
                                <TouchableOpacity onPress={() => setIsNotesVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={20} color={Colors.white} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ padding: Spacing.lg }}>
                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: Colors.border,
                                        borderRadius: BorderRadius.sm,
                                        padding: Spacing.md,
                                        height: 200,
                                        textAlignVertical: 'top',
                                        color: Colors.text,
                                        fontSize: 14
                                    }}
                                    multiline
                                    placeholder="Write your study notes here..."
                                    value={noteText}
                                    onChangeText={setNoteText}
                                />

                                <TouchableOpacity
                                    onPress={handleSaveNote}
                                    disabled={savingNote}
                                    style={{
                                        backgroundColor: Colors.primary,
                                        height: 48,
                                        borderRadius: BorderRadius.sm,
                                        marginTop: Spacing.lg,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: insets.bottom + Spacing.md
                                    }}
                                >
                                    {savingNote ? <ActivityIndicator color="white" /> : <Text style={{ color: Colors.white, fontWeight: '700' }}>SAVE NOTE</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Resume Session Modal */}
            <Modal visible={isResumeModalVisible} transparent={true} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.xl }}>
                    <View style={{ backgroundColor: Colors.white, borderRadius: BorderRadius.md, overflow: 'hidden' }}>
                        <View style={{ padding: Spacing.md, backgroundColor: Colors.primary }}>
                            <Text style={{ color: Colors.white, fontWeight: '700', textAlign: 'center' }}>Resume Session?</Text>
                        </View>
                        <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
                            <MaterialCommunityIcons name="history" size={48} color={Colors.primary} />
                            <Text style={{ ...Typography.body, textAlign: 'center', marginTop: Spacing.md }}>
                                You left off at page {savedPos}. Would you like to continue?
                            </Text>

                            <TouchableOpacity
                                onPress={() => handleResume(true)}
                                style={{
                                    backgroundColor: Colors.primary,
                                    width: '100%',
                                    height: 44,
                                    borderRadius: BorderRadius.sm,
                                    marginTop: Spacing.lg,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Text style={{ color: Colors.white, fontWeight: '700' }}>CONTINUE FROM PAGE {savedPos}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleResume(false)}
                                style={{
                                    marginTop: Spacing.md,
                                    padding: Spacing.sm
                                }}
                            >
                                <Text style={{ color: Colors.textMuted, fontWeight: '700', fontSize: 12 }}>START FROM BEGINNING</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ContentDetailScreen;

