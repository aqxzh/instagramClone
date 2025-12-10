import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { ThemedText } from './themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/app/context/AuthContext';
import axios from 'axios';

import { API_URL } from '../config';

export type Post = {
    id: string;
    imageUrl: string;
    description: string | null;
    author: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
    likes: { userId: string }[];
    _count: {
        comments: number;
    };
};

type PostCardProps = { post: Post, onLike: (postId: string) => void, onDelete?: (postId: string) => void };

export const PostCard = ({ post, onLike, onDelete }: PostCardProps) => {
    const { authState } = useAuth();
    const isLiked = post.likes.some(like => like.userId === authState?.userId);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState('');

    const handleLike = () => {
        onLike(post.id);
    };

    const handleDelete = async () => {
        try {
            console.log('Requesting delete for post', post.id);
            const res = await axios.delete(`${API_URL}/posts/${post.id}`);
            console.log('Delete response', res && res.status, res && res.data);
            if (onDelete) onDelete(post.id);
        } catch (e) {
            console.error('Error deleting post', post.id, e);
        }
    };

    const confirmDelete = () => {
        Alert.alert('Delete post', 'Are you sure you want to delete this post?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: handleDelete },
        ]);
    };

    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            const res = await axios.get(`${API_URL}/posts/${post.id}/comments`);
            setComments(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingComments(false);
        }
    };

    const toggleComments = async () => {
        const next = !showComments;
        setShowComments(next);
        if (next && comments.length === 0) {
            await fetchComments();
        }
    };

    const submitComment = async () => {
        if (!commentText.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/posts/${post.id}/comments`, { content: commentText });
            setComments(prev => [...prev, res.data]);
            setCommentText('');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Image 
                    source={{ uri: post.author.avatarUrl || 'https://via.placeholder.com/40' }}
                    style={styles.avatar}
                />
                <ThemedText style={styles.username}>{post.author.username}</ThemedText>
                {authState?.userId === post.author.id && (
                    <TouchableOpacity onPress={confirmDelete} style={styles.deleteButton}>
                        <MaterialIcons name="delete" size={22} color="gray" />
                    </TouchableOpacity>
                )}
            </View>
            {post.imageUrl ? (
                <Image source={{ uri: post.imageUrl }} style={styles.image} />
            ) : (
                <View style={[styles.image, styles.placeholder]} />
            )}
            <View style={styles.content}>
                <ThemedText style={styles.description}>{post.description}</ThemedText>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                    <MaterialIcons name={isLiked ? "favorite" : "favorite-border"} size={24} color={isLiked ? "red" : "gray"} />
                    <Text style={styles.actionText}>{post.likes.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleComments} style={styles.actionButton}>
                    <MaterialIcons name="comment" size={24} color="gray" />
                    <Text style={styles.actionText}>{post._count.comments + comments.length}</Text>
                </TouchableOpacity>
            </View>

            {showComments && (
                <View style={styles.commentsSection}>
                    <FlatList
                        data={comments}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.comment}>
                                <Image source={{ uri: item.author.avatarUrl || 'https://via.placeholder.com/32' }} style={styles.commentAvatar} />
                                <View style={styles.commentContent}>
                                    <ThemedText style={styles.commentAuthor}>{item.author.username}</ThemedText>
                                    <ThemedText>{item.content}</ThemedText>
                                </View>
                            </View>
                        )}
                    />
                    <View style={styles.commentInputRow}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Write a comment..."
                            value={commentText}
                            onChangeText={setCommentText}
                        />
                        <TouchableOpacity onPress={submitComment} style={styles.sendButton}>
                            <MaterialIcons name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1c1c1e',
        borderRadius: 10,
        marginVertical: 10,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        fontWeight: 'bold',
    },
    image: {
        width: '100%',
        height: 400,
    },
    content: {
        padding: 10,
    },
    description: {},
    actions: {
        flexDirection: 'row',
        padding: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actionText: {
        marginLeft: 5,
        color: 'gray',
    },
    deleteButton: {
        marginLeft: 'auto',
        padding: 6,
    },
    commentsSection: {
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    comment: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    commentContent: {
        flex: 1,
    },
    commentAuthor: {
        fontWeight: 'bold',
    },
    commentInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 8,
        marginRight: 8,
        color: 'white',
    },
    sendButton: {
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 8,
    },
});