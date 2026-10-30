import { Platform } from 'react-native';

// IP máy tính của bạn qua mạng Wi-Fi
const COMPUTER_IP = '192.168.1.5';

// Nếu dùng máy ảo Android thì trỏ về 10.0.2.2, nếu điện thoại thật thì trỏ về 192.168.1.5
export const BASE_URL = Platform.select({
  android: __DEV__ ? `http://${COMPUTER_IP}:3000` : `http://${COMPUTER_IP}:3000`,
  ios: 'http://localhost:3000',
  default: `http://${COMPUTER_IP}:3000`,
});

console.log('🔗 ShopAI đang kết nối Server tại:', BASE_URL);