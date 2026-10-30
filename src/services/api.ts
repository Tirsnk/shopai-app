// shopAI/src/services/api.ts
import { Platform } from 'react-native';

/**
 * ============================================================================
 * CẤU HÌNH ĐỊA CHỈ KẾT NỐI SERVER BACKEND NESTJS CHO SHOPAI
 * ============================================================================
 */

// 1. DÀNH CHO NGROK / LOCALTUNNEL (Khi dùng 4G hoặc khác mạng Wi-Fi):
// Dán link https được cấp từ ngrok hoặc localtunnel vào đây (nếu không dùng thì để trống '')
const TUNNEL_URL = ''; 
// Ví dụ: const TUNNEL_URL = 'https://xxxx-xx-xx.ngrok-free.app';

// 2. DÀNH CHO ĐIỆN THOẠI THẬT CHUNG MẠNG WI-FI:
// Địa chỉ IPv4 của máy tính (xem từ lệnh ipconfig trong PowerShell)
const COMPUTER_IP = '172.19.202.3';

// 3. DÀNH CHO MÁY ẢO ANDROID STUDIO:
// Đổi thành true nếu bạn đang chạy máy ảo trên máy tính, đổi thành false nếu dùng điện thoại thật
const IS_ANDROID_EMULATOR = false;

/**
 * ============================================================================
 * TỰ ĐỘNG XÁC ĐỊNH ĐƯỜNG DẪN GỌI API (BASE_URL)
 * ============================================================================
 */
export const BASE_URL: string = TUNNEL_URL.trim() !== ''
  ? TUNNEL_URL.trim()
  : Platform.select({
      android: IS_ANDROID_EMULATOR
        ? 'http://10.0.2.2:3000'
        : `http://${COMPUTER_IP}:3000`,
      ios: 'http://localhost:3000',
      default: `http://${COMPUTER_IP}:3000`,
    }) as string;

console.log('🔗 ShopAI đang kết nối Server tại:', BASE_URL);