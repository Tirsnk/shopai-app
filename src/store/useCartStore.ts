// src/store/useCartStore.ts
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string | number;
  name: string;
  price: string | number;
  rawPrice?: number;
  image: string;
  quantity: number;
}

interface CartStoreState {
  cartItems: CartItem[];
  shippingFee: number;
  setShippingFee: (fee: number) => void;
  addToCart: (product: any, qty?: number) => void;
  increaseQty: (id: string | number) => void;
  decreaseQty: (id: string | number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      shippingFee: 30000,
      setShippingFee: (fee) => set({ shippingFee: fee }),
      addToCart: (product, qty = 1) => {
        const current = get().cartItems;
        const exist = current.find((item) => item.id === product.id);
        const raw = product.rawPrice || product.price || 500000;
        const priceFormatted =
          typeof product.price === 'string'
            ? product.price
            : `${Number(raw).toLocaleString('vi-VN')} đ`;

        if (exist) {
          set({
            cartItems: current.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
            ),
          });
        } else {
          set({
            cartItems: [
              ...current,
              {
                id: product.id,
                name: product.name || product.title || 'Sản phẩm ShopAI',
                price: priceFormatted,
                rawPrice: typeof raw === 'number' ? raw : 500000,
                image: product.image || 'https://via.placeholder.com/300',
                quantity: qty,
              },
            ],
          });
        }
        Alert.alert('🛒 Giỏ hàng', `Đã thêm ${qty} sản phẩm vào giỏ!`);
      },
      increaseQty: (id) => {
        set({
          cartItems: get().cartItems.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        });
      },
      decreaseQty: (id) => {
        set({
          cartItems: get().cartItems
            .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
            .filter((item) => item.quantity > 0),
        });
      },
      clearCart: () => set({ cartItems: [] }),
      getTotalPrice: () => {
        return get().cartItems.reduce(
          (sum, item) => sum + (item.rawPrice || 500000) * item.quantity,
          0
        );
      },
    }),
    {
      name: 'shopai-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);