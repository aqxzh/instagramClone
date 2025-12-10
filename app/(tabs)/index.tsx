import { Post, PostCard } from '@/components/PostCard';
import { ThemedView } from '@/components/themed-view';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet } from 'react-native';

import { useAuth } from '@/app/context/AuthContext';

import API_URL from '@/config';

export default function FeedScreen() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { authState } = useAuth();

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/posts`);
            setPosts(response.data);
        } catch (error) {
            Alert.alert('Error', 'Could not fetch posts.');
        } finally {
            setLoading(false);
        }
    };

    // useFocusEffect to refetch posts when the screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchPosts();
        }, [])
    );

    const handleLike = async (postId: string) => {
        try {
            await axios.post(`${API_URL}/posts/${postId}/like`);
            // Optimistically update the UI
            setPosts(currentPosts =>
                currentPosts.map(p => {
                    if (p.id === postId) {
                        const isLiked = p.likes.some(l => l.userId === authState.userId);
                        if (isLiked) {
                            return { ...p, likes: p.likes.filter(l => l.userId !== authState.userId) };
                        } else {
                            return { ...p, likes: [...p.likes, { userId: authState.userId! }] };
                        }
                    }
                    return p;
                })
            );
            // We can skip refetching for a smoother experience
            // fetchPosts();
        } catch (error) {
            Alert.alert('Error', 'Could not update like.');
            fetchPosts(); // Refetch on error to revert optimistic update
        }
    };

    if (loading) {
        return (
            <ThemedView style={styles.centerContainer}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={posts}
                renderItem={({ item }) => <PostCard post={item} onLike={handleLike} onDelete={() => fetchPosts()} />}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                onRefresh={fetchPosts}
                refreshing={loading}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 44,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 10,
    },
});