// src/store/useOrderStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem } from './useCartStore';

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'PENDING' | 'PAID';
}

interface OrderState {
  orders: Order[];
  createOrder: (items: CartItem[], total: number) => string;
  payOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      createOrder: (items, total) => {
        const newId = `ORD-${Date.now().toString().slice(-6)}`;
        const newOrder: Order = {
          id: newId,
          date:
            new Date().toLocaleTimeString('vi-VN') +
            ' ' +
            new Date().toLocaleDateString('vi-VN'),
          items,
          total,
          status: 'PENDING',
        };
        set({ orders: [newOrder, ...get().orders] });
        return newId;
      },
      payOrder: (orderId) => {
        set({
          orders: get().orders.map((o) =>
            o.id === orderId ? { ...o, status: 'PAID' } : o
          ),
        });
      },
    }),
    { name: 'shopai-order-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);