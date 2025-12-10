import { useAuth } from '@/app/context/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Image, Platform, StyleSheet, View } from 'react-native';

import API_URL from '@/config';

import { PostCard } from '@/components/PostCard';


export default function ProfileScreen() {
  const { onLogout, authState } = useAuth();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleLogout = async () => {
    await onLogout!();
    router.replace('/login');
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`);
      const userPosts = res.data.filter((p: any) => p.author?.id === authState.userId);
      setPosts(userPosts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.userId) fetchPosts();
    else setLoading(false);
  }, [authState.userId]);

  useEffect(() => {
    if (isFocused && authState.userId) fetchPosts();
  }, [isFocused]);

  const avatarUrl = posts[0]?.author?.avatarUrl;
  const username = posts[0]?.author?.username || 'User';

  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;
    const uri = result.assets[0].uri;

    const formData = new FormData();
    if (Platform.OS === 'web') {
      const r = await fetch(uri);
      const blob = await r.blob();
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      formData.append('avatar', file);
    } else {
      formData.append('avatar', {
        uri,
        name: `avatar.jpg`,
        type: `image/jpeg`,
      } as any);
    }

    try {
      setUploadingAvatar(true);
      await axios.put(`${API_URL}/users/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // refresh posts/user info
      await fetchPosts();
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <ThemedText type="title">{username.charAt(0).toUpperCase()}</ThemedText>
          </View>
        )}
        <ThemedText type="title" style={styles.username}>{username}</ThemedText>
      </View>

      <View style={styles.logout}>
        <Button title={uploadingAvatar ? 'Uploading...' : 'Change Avatar'} onPress={pickAvatar} disabled={uploadingAvatar} />
      </View>

      <View style={styles.logout}>
        <Button title="Logout" onPress={handleLogout} />
      </View>

      <ThemedText type="subtitle" style={styles.section}>Publications</ThemedText>

      {posts.length === 0 ? (
        <ThemedText>No posts yet.</ThemedText>
      ) : (
        <FlatList
          style={styles.list}
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={async (postId) => {
                try {
                  await axios.post(`${API_URL}/posts/${postId}/like`);
                } catch (e) {
                  console.error(e);
                } finally {
                  fetchPosts();
                }
              }}
              onDelete={() => fetchPosts()}
            />
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 44,
    paddingHorizontal: 20,
  },
  center: {
    flex:1,
    alignItems:'center',
    justifyContent:'center',
  },
  header: {
    alignItems:'center',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height:96,
    borderRadius: 48,
    marginBottom:8,
  },
  avatarPlaceholder: {
    width:96,
    height:96,
    borderRadius:48,
    backgroundColor:'#666',
    alignItems:'center',
    justifyContent:'center',
    marginBottom:8,
  },
  username: {
    marginBottom: 8,
    textAlign:'center',
  },
  logout: {
    marginVertical:8,
    alignSelf:'center',
  },
  section: {
    marginTop:12,
    marginBottom:8,
  },
  list: {
    flex:1,
  },
  post: {
    marginBottom:16,
    borderRadius:8,
    overflow:'hidden',
  },
  postImage: {
    width:'100%',
    height:200,
  },
  postDesc: {
    marginTop:8,
  },
  postMeta: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 6,
    color: 'gray',
  },
});