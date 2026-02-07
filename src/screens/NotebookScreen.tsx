import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { notesService } from '../services/notes';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../theme';

const NotebookScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotes = async () => {
        if (!user) return;
        const data = await notesService.getUserNotes(user.userId);
        setNotes(data);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchNotes();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotes();
    };

    const handleDeleteNote = async (noteId: string) => {
        Alert.alert(
            "Delete Note",
            "Are you sure you want to remove this study reflection?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const success = await notesService.deleteNote(noteId);
                        if (success) {
                            setNotes(prev => prev.filter(n => n.$id !== noteId));
                            Toast.show({
                                type: 'success',
                                text1: 'Note Deleted'
                            });
                        }
                    }
                }
            ]
        );
    };

    const handleEditNote = (item: any) => {
        if (!item.contentItem) {
            Toast.show({
                type: 'error',
                text1: 'Material Missing',
                text2: 'The source material is no longer available.'
            });
            return;
        }

        navigation.navigate('ContentDetail', {
            item: item.contentItem,
            autoOpenNotes: true
        });
    };

    const renderNoteItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <View style={{
                backgroundColor: Colors.white,
                marginHorizontal: Spacing.md,
                marginBottom: Spacing.sm,
                borderRadius: BorderRadius.xs,
                borderWidth: 1,
                borderColor: Colors.border,
                padding: Spacing.md,
                ...Shadow.small
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...Typography.caption, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase' }}>
                            {item.contentSubject || 'General'}
                        </Text>
                        <Text style={{ ...Typography.body, fontWeight: '700', marginTop: 2 }}>{item.contentTitle}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDeleteNote(item.$id)}
                        style={{ padding: 4 }}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                </View>

                <View style={{
                    backgroundColor: Colors.background,
                    padding: Spacing.sm,
                    borderRadius: BorderRadius.xs,
                    marginBottom: Spacing.md
                }}>
                    <Text style={{ ...Typography.body, fontSize: 13, color: Colors.text }}>{item.text}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
                        {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>

                    <TouchableOpacity
                        onPress={() => handleEditNote(item)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: Colors.primaryLight,
                            paddingHorizontal: Spacing.sm,
                            paddingVertical: 6,
                            borderRadius: BorderRadius.xs,
                            borderWidth: 1,
                            borderColor: Colors.primary
                        }}
                    >
                        <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.primary} />
                        <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 12, marginLeft: 4 }}>OPEN MATERIAL</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

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
                        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '700' }}>Study Notebook</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{notes.length} Reflections</Text>
                    </View>
                </View>
            </View>

            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={notes}
                        renderItem={renderNoteItem}
                        keyExtractor={item => item.$id}
                        contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                        }
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: 100, paddingHorizontal: 40 }}>
                                <MaterialCommunityIcons name="notebook-outline" size={64} color={Colors.border} />
                                <Text style={{ ...Typography.h2, textAlign: 'center', marginTop: Spacing.md }}>Notebook Empty</Text>
                                <Text style={{ ...Typography.body, textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.sm }}>
                                    Your study reflections and notes will appear here.
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
};

export default NotebookScreen;

