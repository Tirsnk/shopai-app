// src/store/useAuthStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureTokenService } from '../services/secureTokenService';

export interface UserAccount {
  fullName: string;
  username: string;
  phone: string;
  password?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  currentUser: string;
  registeredUsers: UserAccount[];
  login: (username: string, password: string) => boolean;
  loginWithBiometrics: (targetUser?: string) => boolean;
  register: (user: UserAccount) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      currentUser: 'admin',
      registeredUsers: [
        { fullName: 'La Văn Trí', username: 'admin', password: '123456', phone: '0987654321' },
      ],
      login: (username, password) => {
        const found = get().registeredUsers.find(
          (u) => u.username === username && u.password === password
        );
        if (found || (username === 'tri' && password === '1234')) {
          set({ isLoggedIn: true, currentUser: username });
          secureTokenService.saveToken('jwt_mock_token_shopai_' + Date.now()).catch(() => {});
          return true;
        }
        return false;
      },
      loginWithBiometrics: (targetUser) => {
        const user = targetUser || get().currentUser || 'admin';
        set({ isLoggedIn: true, currentUser: user });
        secureTokenService.saveToken('jwt_mock_token_shopai_' + Date.now()).catch(() => {});
        return true;
      },
      register: (newUser) => set({ registeredUsers: [...get().registeredUsers, newUser] }),
      logout: () => {
        secureTokenService.removeToken().catch(() => {});
        set({ isLoggedIn: false });
      },
    }),
    { name: 'shopai-auth-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);