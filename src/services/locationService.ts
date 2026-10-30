import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

// Tọa độ kho trung tâm ShopAI (Ví dụ: Kho TP.HCM)
const WAREHOUSE_COORDS = {
  latitude: 10.8231,
  longitude: 106.6297,
};

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Quyền truy cập vị trí',
        message: 'ShopAI cần vị trí của bạn để tính khoảng cách và phí giao hàng.',
        buttonPositive: 'Đồng ý',
        buttonNegative: 'Từ chối',
      },
    );

    if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Alert.alert(
        'Quyền bị chặn',
        'Bạn đã chặn quyền vị trí. Vui lòng vào Cài đặt ứng dụng để cấp quyền thủ công.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}

export async function getCurrentLocation(): Promise<LocationCoords | null> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return null;

  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        Alert.alert('Lỗi GPS', `Không thể lấy vị trí: ${error.message}`);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000,
      },
    );
  });
}

// Công thức Haversine tính khoảng cách theo km
export function calculateDistanceKm(userCoords: LocationCoords): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((userCoords.latitude - WAREHOUSE_COORDS.latitude) * Math.PI) / 180;
  const dLon = ((userCoords.longitude - WAREHOUSE_COORDS.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((WAREHOUSE_COORDS.latitude * Math.PI) / 180) *
      Math.cos((userCoords.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}