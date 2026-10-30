// navigation/RootNavigator.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import màn hình HomeScreen và CartScreen của bạn
import HomeScreen from '../src/screens/HomeScreen';
import CartScreen from '../src/screens/CartScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

// 1. Màn hình Chi tiết sản phẩm
function DetailScreen({ route, navigation }: any) {
  const { product } = route.params || {};
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>📦 Chi tiết sản phẩm</Text>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 5 }}>{product?.name}</Text>
      <Text style={{ fontSize: 16, color: 'green', fontWeight: 'bold', marginBottom: 20 }}>Giá: {product?.price}</Text>
      <Button title="Quay lại" onPress={() => navigation.goBack()} />
    </View>
  );
}

// 2. Stack riêng cho nhánh Trang chủ (Home -> Detail)
function HomeStackScreen({ cartItems, onAddToCart }: any) {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" options={{ headerShown: false }}>
        {(props) => <HomeScreen {...props} cartItems={cartItems} onAddToCart={onAddToCart} />}
      </HomeStack.Screen>
      <HomeStack.Screen name="Detail" component={DetailScreen} options={{ title: 'Chi Tiết Sản Phẩm' }} />
    </HomeStack.Navigator>
  );
}

// 3. Màn hình Cá nhân / Tài khoản (Có nút Đăng xuất)
function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <View style={styles.container}>
      <Ionicons name="person-circle-outline" size={80} color="#007AFF" style={{ alignSelf: 'center', marginBottom: 16 }} />
      <Text style={styles.title}>Thông tin cá nhân</Text>
      <Text style={styles.profileInfo}>Họ tên: La Văn Trí</Text>
      <Text style={styles.profileInfo}>Mã sinh viên: 23735511</Text>
      <Text style={styles.profileInfo}>Tài khoản: admin</Text>

      <View style={[styles.buttonWrapper, { marginTop: 30 }]}>
        <Button title="Đăng xuất tài khoản" color="#FF3B30" onPress={onLogout} />
      </View>
    </View>
  );
}

// 4. Bottom Tab Navigator (Thanh điều hướng đáy gồm 3 Tab: Trang chủ, Giỏ hàng, Tài khoản)
function MainTabs({ cartItems, onAddToCart, onLogout }: any) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CartTab') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'AccountTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="HomeTab" options={{ title: 'Trang chủ' }}>
        {() => <HomeStackScreen cartItems={cartItems} onAddToCart={onAddToCart} />}
      </Tab.Screen>
      <Tab.Screen name="CartTab" options={{ title: 'Giỏ hàng' }}>
        {() => <CartScreen cartItems={cartItems} />}
      </Tab.Screen>
      <Tab.Screen name="AccountTab" options={{ title: 'Tài khoản' }}>
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// 5. Màn hình Đăng nhập
function LoginScreen({ navigation, onLogin }: { navigation: any; onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginPress = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return;
    }

    if (username === 'admin' && password === '123456') {
      onLogin();
    } else {
      Alert.alert('Đăng nhập thất bại', 'Sai tài khoản hoặc mật khẩu! (Gợi ý: admin / 123456)');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Đăng nhập ShopAI</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Nhập tên đăng nhập" 
        placeholderTextColor="#888"
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Nhập mật khẩu" 
        placeholderTextColor="#888"
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      
      <View style={styles.buttonWrapper}>
        <Button title="Đăng nhập" onPress={handleLoginPress} />
      </View>
      
      <View style={styles.buttonWrapper}>
        <Button 
          title="Đăng ký tài khoản mới" 
          color="#28a745" 
          onPress={() => navigation.navigate('Register')} 
        />
      </View>
    </View>
  );
}

// 6. Màn hình Đăng ký
function RegisterScreen({ navigation }: { navigation: any }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegisterPress = () => {
    if (!fullName.trim() || !username.trim() || !password.trim() || !phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tất cả các trường!');
      return;
    }

    Alert.alert('Thành công', `Đăng ký thành công cho tài khoản: ${username}!`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 Đăng ký tài khoản</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Họ và tên" 
        placeholderTextColor="#888"
        value={fullName} 
        onChangeText={setFullName} 
      />

      <TextInput 
        style={styles.input} 
        placeholder="Tên đăng nhập" 
        placeholderTextColor="#888"
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Mật khẩu" 
        placeholderTextColor="#888"
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <TextInput 
        style={styles.input} 
        placeholder="Số điện thoại" 
        placeholderTextColor="#888"
        value={phone} 
        onChangeText={setPhone} 
        keyboardType="phone-pad"
      />
      
      <View style={styles.buttonWrapper}>
        <Button title="Đăng ký" color="#28a745" onPress={handleRegisterPress} />
      </View>
      
      <View style={styles.buttonWrapper}>
        <Button 
          title="Quay lại Đăng nhập" 
          color="gray" 
          onPress={() => navigation.goBack()} 
        />
      </View>
    </View>
  );
}

// 7. Root Navigator tổng quản lý Auth Stack & Main App
export default function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  const handleAddToCart = (product: any) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((i) => i.id === product.id);
      if (existing) {
        return prevItems.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
    Alert.alert('🛒 Giỏ hàng ShopAI', `Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Group>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: true, title: 'Đăng ký tài khoản' }} />
          </Stack.Group>
        ) : (
          <Stack.Screen name="MainApp">
            {() => <MainTabs cartItems={cartItems} onAddToCart={handleAddToCart} onLogout={() => setIsLoggedIn(false)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 30 
  },
  input: { 
    height: 50, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    marginBottom: 15, 
    backgroundColor: '#f9f9f9' 
  },
  buttonWrapper: {
    marginBottom: 12,
  },
  profileInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  }
});