// src/services/secureTokenService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'shopai_secure_access_token';

export const secureTokenService = {
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.log('Lỗi lưu token:', e);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.log('Lỗi xoá token:', e);
    }
  },
};