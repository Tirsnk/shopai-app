import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Vibration,
} from 'react-native';
import { BASE_URL } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isError?: boolean;
}

const SUGGESTIONS = [
  'Tư vấn bàn phím cơ chơi game Pro',
  'Tai nghe có mic khử ồn tốt không?',
  'Đồng hồ Smartwatch có đo được SpO2 không?',
  'Chính sách giao hàng và đổi trả ra sao?',
];

export const AIChatScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const lastFailedMessage = useRef<string | null>(null);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
    };

    setMessages((prev) => [userMsg, ...prev]);
    if (!textToSend) setInputText('');
    setIsLoading(true);
    lastFailedMessage.current = null;

    try {
      // Gọi qua NestJS AI Proxy (API Key được bảo vệ tuyệt đối trên Server)
      const response = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`Mã lỗi máy chủ: ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.reply || 'Dạ ShopAI có thể hỗ trợ gì thêm cho bạn ạ?';

      try {
        Vibration.vibrate(60);
      } catch (e) {
        // Bỏ qua nếu thiết bị không hỗ trợ rung
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: 'ai',
      };
      setMessages((prev) => [aiMsg, ...prev]);
    } catch (error: any) {
      console.log('Lỗi kết nối Backend NestJS:', error?.message);
      lastFailedMessage.current = text;

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '⚠️ Không thể kết nối tới Server NestJS. Vui lòng đảm bảo Server Backend đang chạy và điện thoại cùng mạng Wi-Fi!',
        sender: 'ai',
        isError: true,
      };
      setMessages((prev) => [errorMsg, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage.current) {
      sendMessage(lastFailedMessage.current);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={[
          styles.bubbleWrapper,
          isUser ? styles.userWrapper : styles.aiWrapper,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
            item.isError && styles.errorBubble,
          ]}
        >
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
            {item.text}
          </Text>
        </View>

        {item.isError && (
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryBtnText}>🔄 Thử lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Quay lại</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Trợ lý Tư vấn ShopAI 🤖</Text>
          <Text style={styles.headerSubtitle}>Trực tuyến • NestJS AI Proxy</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Xin chào bạn! 👋</Text>
            <Text style={styles.emptyDesc}>
              Mình là Trợ lý ShopAI được bảo vệ bởi Backend NestJS. Hãy bấm gợi ý hoặc gõ câu hỏi để mình hỗ trợ nhé:
            </Text>
            <View style={styles.suggestionsList}>
              {SUGGESTIONS.map((sug, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(sug)}
                >
                  <Text style={styles.suggestionText}>💬 {sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            inverted
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {isLoading && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#0F766E" />
            <Text style={styles.typingText}>ShopAI đang kết nối máy chủ & soạn tin...</Text>
          </View>
        )}

        {/* Khung nhập tin nhắn */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi cần tư vấn..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={250}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendBtnText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 6 : 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#34D399',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#0F766E',
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorBubble: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  bubbleText: {
    color: '#F1F5F9',
    fontSize: 15,
    lineHeight: 21,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  retryBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  retryBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  suggestionsList: {
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  suggestionText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '500',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  typingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 90,
  },
  sendBtn: {
    backgroundColor: '#0F766E',
    marginLeft: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  sendBtnDisabled: {
    backgroundColor: '#475569',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AIChatScreen;