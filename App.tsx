// App.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  BackHandler,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactNativeBiometrics from 'react-native-biometrics';

import HomeScreen from './src/screens/HomeScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';

// --- IMPORT CHƯƠNG 8: SECURITY & AI ---
import { useAppLock } from './src/hooks/useAppLock';
import { BiometricGateScreen } from './src/screens/BiometricGateScreen';
import { AIChatScreen } from './src/screens/AIChatScreen';
import { secureTokenService } from './src/services/secureTokenService';

// ==========================================
// 1. ZUSTAND STORES (AUTH, CART, ORDERS)
// ==========================================

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
      currentUser: '',
      registeredUsers: [
        { fullName: 'La Văn Trí', username: 'admin', password: '123456', phone: '0987654321' },
      ],
      login: (username, password) => {
        const found = get().registeredUsers.find(
          (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
        );
        if (found || (username.trim() === 'tri' && password === '1234')) {
          set({ isLoggedIn: true, currentUser: username.trim() });
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
      register: (newUser) =>
        set({ registeredUsers: [...get().registeredUsers, newUser] }),
      logout: () => {
        secureTokenService.removeToken().catch(() => {});
        set({ isLoggedIn: false });
      },
    }),
    { name: 'shopai-auth-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);

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
        const raw = product.rawPrice || 500000;
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
                price: product.price || `${raw.toLocaleString('vi-VN')} đ`,
                rawPrice: raw,
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
    { name: 'shopai-cart-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);

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

const queryClient = new QueryClient();

// ==========================================
// 2. MÀN HÌNH ĐĂNG NHẬP & ĐĂNG KÝ TÀI KHOẢN
// ==========================================

function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  // Bỏ điền sẵn: Cả hai ô đều rỗng để người dùng tự gõ
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Quản lý Modal Đăng ký tài khoản
  const [isRegisterVisible, setIsRegisterVisible] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const login = useAuthStore((s) => s.login);
  const loginWithBiometrics = useAuthStore((s) => s.loginWithBiometrics);
  const register = useAuthStore((s) => s.register);

  // Xử lý Đăng nhập thủ công
  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!');
      return;
    }

    const success = login(username.trim(), password.trim());
    if (success) {
      onLoginSuccess();
    } else {
      Alert.alert(
        'Đăng nhập thất bại',
        'Tên tài khoản hoặc mật khẩu không chính xác!\n\n(Nếu chưa có tài khoản, bạn hãy bấm Đăng ký ngay bên dưới)'
      );
    }
  };

  // Đăng nhập nhanh bằng cảm biến Vân tay / Face ID
  const handleBiometricLogin = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available } = await rnBiometrics.isSensorAvailable();

      if (!available) {
        Alert.alert(
          'Không khả dụng',
          'Thiết bị chưa cài đặt vân tay trong Cài đặt máy hoặc không hỗ trợ sinh trắc học.'
        );
        return;
      }

      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Xác thực Vân tay / Face ID để đăng nhập ShopAI',
        cancelButtonText: 'Dùng mật khẩu',
      });

      if (success) {
        loginWithBiometrics(username.trim() || 'admin');
        onLoginSuccess();
      }
    } catch (error: any) {
      console.log('Lỗi xác thực vân tay:', error?.message);
    }
  };

  // Xử lý Đăng ký tài khoản mới
  const handleRegisterSubmit = () => {
    if (!regFullName.trim() || !regUsername.trim() || !regPassword.trim() || !regPhone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tất cả các trường thông tin!');
      return;
    }

    register({
      fullName: regFullName.trim(),
      username: regUsername.trim(),
      password: regPassword.trim(),
      phone: regPhone.trim(),
    });

    Alert.alert(
      'Đăng ký thành công 🎉',
      `Tài khoản "${regUsername.trim()}" đã được đăng ký thành công! Hãy dùng tài khoản này để đăng nhập ngay.`,
      [
        {
          text: 'Đăng nhập ngay',
          onPress: () => {
            setUsername(regUsername.trim());
            setPassword(regPassword.trim());
            setIsRegisterVisible(false);
            setRegFullName('');
            setRegUsername('');
            setRegPassword('');
            setRegPhone('');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.loginInner}
      >
        <Text style={styles.loginLogo}>🛒</Text>
        <Text style={styles.loginTitle}>ShopAI Đăng Nhập</Text>
        <Text style={styles.loginSubtitle}>Nhập thông tin tài khoản để bắt đầu mua sắm</Text>

        <View style={styles.loginCard}>
          <Text style={styles.inputLabel}>Tên tài khoản</Text>
          <TextInput
            style={styles.loginInput}
            placeholder="Nhập tên tài khoản (username)..."
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Mật khẩu</Text>
          <TextInput
            style={styles.loginInput}
            placeholder="Nhập mật khẩu..."
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Nút Đăng nhập */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.8}>
            <Text style={styles.loginBtnText}>Đăng Nhập</Text>
          </TouchableOpacity>

          {/* Dải phân cách */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* NÚT ĐĂNG NHẬP NHANH BẰNG SINH TRẮC HỌC */}
          <TouchableOpacity
            style={styles.biometricLoginBtn}
            onPress={handleBiometricLogin}
            activeOpacity={0.8}
          >
            <Ionicons name="finger-print-outline" size={22} color="#0F766E" />
            <Text style={styles.biometricLoginBtnText}>Đăng nhập bằng Vân tay / Face ID</Text>
          </TouchableOpacity>

          {/* NÚT MỞ BẢNG ĐĂNG KÝ TÀI KHOẢN MỚI */}
          <TouchableOpacity
            style={styles.registerLinkBtn}
            onPress={() => setIsRegisterVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.registerLinkText}>
              Chưa có tài khoản? <Text style={styles.registerLinkHighlight}>Đăng ký ngay</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* MODAL ĐĂNG KÝ TÀI KHOẢN */}
      <Modal
        visible={isRegisterVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRegisterVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Đăng ký tài khoản mới</Text>
              <TouchableOpacity onPress={() => setIsRegisterVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Nhập họ và tên..."
                placeholderTextColor="#94A3B8"
                value={regFullName}
                onChangeText={setRegFullName}
              />

              <Text style={styles.inputLabel}>Tên đăng nhập</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Chọn tên đăng nhập..."
                placeholderTextColor="#94A3B8"
                value={regUsername}
                onChangeText={setRegUsername}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor="#94A3B8"
                value={regPassword}
                onChangeText={setRegPassword}
                secureTextEntry
              />

              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Nhập số điện thoại..."
                placeholderTextColor="#94A3B8"
                value={regPhone}
                onChangeText={setRegPhone}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleRegisterSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitBtnText}>Xác nhận Đăng ký</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsRegisterVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Quay lại Đăng nhập</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// 3. MÀN HÌNH CHI TIẾT & LỊCH SỬ ĐƠN HÀNG
// ==========================================

function DetailScreen({
  product,
  onBack,
  onBuyNow,
}: {
  product: any;
  onBack: () => void;
  onBuyNow: (p: any, qty: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore((s) => s.addToCart);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.detailContainer}>
        <View style={styles.detailHeaderBar}>
          <TouchableOpacity onPress={onBack} style={styles.backButtonIcon}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>Chi tiết sản phẩm</Text>
          <View style={{ width: 24 }} />
        </View>

        <Image
          source={{ uri: product?.image || 'https://via.placeholder.com/300' }}
          style={styles.detailImage}
        />

        <View style={styles.detailInfoBox}>
          <Text style={styles.detailProductName}>
            {product?.name || product?.title || 'Sản phẩm ShopAI'}
          </Text>
          <Text style={styles.detailPrice}>{product?.price || '0 đ'}</Text>
          <Text style={styles.detailDescription}>
            {product?.description || 'Hàng chính hãng phân phối bởi ShopAI.'}
          </Text>
        </View>

        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Số lượng</Text>
          <View style={styles.quantityStepper}>
            <TouchableOpacity
              style={[styles.stepperBtn, quantity === 1 && styles.stepperBtnDisabled]}
              onPress={handleDecrease}
              disabled={quantity === 1}
            >
              <Text style={styles.stepperBtnText}>-</Text>
            </TouchableOpacity>

            <View style={styles.stepperValueBox}>
              <Text style={styles.stepperValueText}>{quantity}</Text>
            </View>

            <TouchableOpacity style={styles.stepperBtn} onPress={handleIncrease}>
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.shopeeFooter}>
        <TouchableOpacity
          style={styles.shopeeAddToCartBtn}
          onPress={() => addToCart(product, quantity)}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={20} color="#0F766E" />
          <Text style={styles.shopeeAddToCartText}>Thêm vào giỏ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shopeeBuyNowBtn}
          onPress={() => onBuyNow(product, quantity)}
          activeOpacity={0.8}
        >
          <Text style={styles.shopeeBuyNowText}>Mua ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function OrdersScreen({ onBack }: { onBack: () => void }) {
  const { orders, payOrder } = useOrderStore();

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonIcon}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.subHeaderTitle}>Lịch sử hóa đơn</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
            Chưa có đơn hàng nào!
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>#{item.id}</Text>
              <Text
                style={{
                  fontWeight: 'bold',
                  color: item.status === 'PAID' ? '#16A34A' : '#F59E0B',
                }}
              >
                ● {item.status}
              </Text>
            </View>
            <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{item.date}</Text>
            <Text style={{ fontWeight: '600', color: '#FF3B30', fontSize: 15, marginBottom: 10 }}>
              Tổng: {item.total.toLocaleString('vi-VN')} đ ({item.items.length} món)
            </Text>

            {item.status === 'PENDING' && (
              <TouchableOpacity
                style={styles.payNowBtn}
                onPress={() => {
                  payOrder(item.id);
                  Alert.alert('Thành công', `Đơn #${item.id} đã chuyển sang PAID!`);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Thanh toán giả lập (PAID)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

// ==========================================
// 4. MAIN CONTROLLER
// ==========================================

function MainApp() {
  const { isLoggedIn, currentUser, logout } = useAuthStore();
  const { cartItems, addToCart, increaseQty, decreaseQty } = useCartStore();

  const { isLocked, unlock } = useAppLock();
  const [showAIChat, setShowAIChat] = useState(false);

  const [currentScreen, setCurrentScreen] = useState<
    'home' | 'cart' | 'detail' | 'checkout' | 'orders' | 'profile'
  >('home');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const backAction = () => {
      if (showAIChat) {
        setShowAIChat(false);
        return true;
      }
      if (currentScreen !== 'home' && isLoggedIn) {
        if (currentScreen === 'checkout') {
          setCurrentScreen('cart');
          return true;
        }
        setCurrentScreen('home');
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentScreen, isLoggedIn, showAIChat]);

  // 1. Luồng chưa đăng nhập -> Hiển thị form đăng nhập (ô trống + Đăng ký)
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={unlock} />;
  }

  // 2. Luồng đã đăng nhập nhưng bị khóa bảo mật (Biometric App Lock)
  if (isLocked) {
    return <BiometricGateScreen onUnlockSuccess={unlock} onFallbackLogin={logout} />;
  }

  // 3. Luồng mở Trợ lý Chat AI
  if (showAIChat) {
    return <AIChatScreen onBack={() => setShowAIChat(false)} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <View style={{ flex: 1 }}>
        {currentScreen === 'home' && (
          <HomeScreen
            onNavigateToCart={() => setCurrentScreen('cart')}
            onNavigateToDetail={(p) => {
              setSelectedProduct(p);
              setCurrentScreen('detail');
            }}
          />
        )}

        {currentScreen === 'cart' && (
          <View style={{ flex: 1 }}>
            <CartScreen
              cartItems={cartItems}
              onIncrease={increaseQty}
              onDecrease={decreaseQty}
              onBack={() => setCurrentScreen('home')}
            />
            {cartItems.length > 0 && (
              <TouchableOpacity
                style={styles.proceedCheckoutBtn}
                onPress={() => setCurrentScreen('checkout')}
              >
                <Text style={styles.proceedCheckoutText}>Tiến hành Đặt hàng / Thanh toán ➔</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {currentScreen === 'detail' && (
          <DetailScreen
            product={selectedProduct}
            onBack={() => setCurrentScreen('home')}
            onBuyNow={(p, qty) => {
              addToCart(p, qty);
              setCurrentScreen('checkout');
            }}
          />
        )}

        {currentScreen === 'checkout' && (
          <CheckoutScreen
            onBack={() => setCurrentScreen('cart')}
            onComplete={() => setCurrentScreen('orders')}
          />
        )}

        {currentScreen === 'orders' && <OrdersScreen onBack={() => setCurrentScreen('home')} />}

        {currentScreen === 'profile' && (
          <View
            style={[
              styles.container,
              {
                padding: 20,
                alignItems: 'center',
                paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20,
              },
            ]}
          >
            <Ionicons name="person-circle" size={80} color="#007AFF" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginVertical: 8 }}>{currentUser}</Text>
            <TouchableOpacity style={styles.ordersNavBtn} onPress={() => setCurrentScreen('orders')}>
              <Ionicons name="receipt-outline" size={20} color="#007AFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Xem Lịch sử Đơn hàng (Orders)</Text>
            </TouchableOpacity>
            <Button title="Đăng xuất" color="#FF3B30" onPress={logout} />
          </View>
        )}
      </View>

      {/* NÚT TRÒN NỔI MỞ TRỢ LÝ AI */}
      <TouchableOpacity
        style={styles.floatingAiBtn}
        onPress={() => setShowAIChat(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingAiText}>🤖</Text>
      </TouchableOpacity>

      {/* BOTTOM TAB MENU */}
      {!['detail', 'checkout'].includes(currentScreen) && (
        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentScreen('home')}>
            <Ionicons
              name={currentScreen === 'home' ? 'home' : 'home-outline'}
              size={24}
              color="#007AFF"
            />
            <Text style={styles.tabTxt}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentScreen('cart')}>
            <Ionicons
              name={currentScreen === 'cart' ? 'cart' : 'cart-outline'}
              size={24}
              color="#007AFF"
            />
            <Text style={styles.tabTxt}>
              Giỏ hàng ({cartItems.reduce((s, i) => s + i.quantity, 0)})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentScreen('orders')}>
            <Ionicons
              name={currentScreen === 'orders' ? 'receipt' : 'receipt-outline'}
              size={24}
              color="#007AFF"
            />
            <Text style={styles.tabTxt}>Đơn hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={() => setCurrentScreen('profile')}>
            <Ionicons
              name={currentScreen === 'profile' ? 'person' : 'person-outline'}
              size={24}
              color="#007AFF"
            />
            <Text style={styles.tabTxt}>Tôi</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}

// ==========================================
// 5. STYLESHEET
// ==========================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },

  loginContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loginInner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginLogo: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  loginInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 8,
  },
  loginBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  biometricLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#0F766E',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
  },
  biometricLoginBtnText: {
    color: '#0F766E',
    fontSize: 15,
    fontWeight: '700',
  },

  registerLinkBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 6,
  },
  registerLinkText: {
    fontSize: 14,
    color: '#64748B',
  },
  registerLinkHighlight: {
    color: '#0F766E',
    fontWeight: '700',
  },

  // Modal Đăng ký
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '85%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubmitBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },

  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  subHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
  detailContainer: { flexGrow: 1, backgroundColor: '#fff', paddingBottom: 20 },
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButtonIcon: { padding: 4 },
  detailHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  detailImage: { width: '100%', height: 260, resizeMode: 'contain' },
  detailInfoBox: { padding: 16 },
  detailProductName: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  detailPrice: { fontSize: 20, fontWeight: 'bold', color: '#FF3B30', marginBottom: 8 },
  detailDescription: { color: '#666', lineHeight: 20 },

  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 10,
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 38,
    height: 34,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  stepperBtnText: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '600',
  },
  stepperValueBox: {
    minWidth: 44,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
  },
  stepperValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },

  shopeeFooter: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  shopeeAddToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E6FFFA',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  shopeeAddToCartText: {
    color: '#0F766E',
    fontWeight: 'bold',
    fontSize: 14,
  },
  shopeeBuyNowBtn: {
    flex: 1.2,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopeeBuyNowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  orderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  payNowBtn: { backgroundColor: '#0F766E', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  proceedCheckoutBtn: {
    backgroundColor: '#0F766E',
    padding: 16,
    alignItems: 'center',
    margin: 16,
    borderRadius: 10,
  },
  proceedCheckoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  ordersNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    marginBottom: 20,
  },
  bottomTab: {
    flexDirection: 'row',
    height: Platform.OS === 'android' ? 68 : 74,
    paddingBottom: Platform.OS === 'android' ? 10 : 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabBtn: { alignItems: 'center' },
  tabTxt: { fontSize: 11, color: '#007AFF', marginTop: 2 },

  floatingAiBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 82 : 88,
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    zIndex: 9999,
  },
  floatingAiText: {
    fontSize: 26,
  },
});