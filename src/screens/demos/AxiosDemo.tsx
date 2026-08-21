import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import axios from 'axios';

type Post = { id: number; title: string; body: string };

const api = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
});

async function loadPosts(): Promise<Post[]> {
  const res = await api.get<Post[]>('/posts', { params: { _limit: 5 } });
  return res.data; // không cần res.json(), không cần if (!res.ok)
}

export default function AxiosDemo() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadPosts();
      setItems(data);
    } catch (e) {
      // Axios nhét chi tiết vào e.response (nếu server có trả lời)
      setError('Không tải được dữ liệu. Kiểm tra mạng hoặc URL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await loadPosts();
        if (alive) setItems(data);
      } catch {
        if (alive) setError('Không tải được dữ liệu. Kiểm tra mạng hoặc URL.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF4D4F" />
        <Text style={styles.hint}>Đang tải (Axios)...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={load} style={styles.btn}>
          <Text style={styles.btnText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={styles.header}>Axios Demo — cùng API với Fetch</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hint: { marginTop: 12, color: '#7F8C8D' },
  error: { color: '#FF4D4F', textAlign: 'center', marginBottom: 16 },
  btn: {
    backgroundColor: '#FF4D4F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  list: { padding: 16 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#2C3E50' },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: { fontWeight: '700', color: '#2C3E50' },
});