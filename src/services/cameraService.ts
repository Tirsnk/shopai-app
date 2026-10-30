import { launchCamera, CameraOptions } from 'react-native-image-picker';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

// Hàm xin quyền truy cập Camera trên Android
async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Cấp quyền Camera',
        message: 'ShopAI cần quyền mở Camera để chụp ảnh tìm kiếm sản phẩm.',
        buttonPositive: 'Đồng ý',
        buttonNegative: 'Hủy',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}

// Hàm mở Camera và trả về đường dẫn ảnh (URI)
export async function openCamera(): Promise<string | null> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    Alert.alert('Từ chối quyền', 'Bạn chưa cấp quyền sử dụng camera.');
    return null;
  }

  const options: CameraOptions = {
    mediaType: 'photo',
    quality: 0.8,
    saveToPhotos: true, // Lưu ảnh vừa chụp vào bộ sưu tập máy
  };

  const response = await launchCamera(options);

  if (response.didCancel) {
    return null; // Người dùng hủy chụp
  }

  if (response.errorCode) {
    Alert.alert('Lỗi', response.errorMessage || 'Không thể mở camera');
    return null;
  }

  // Lấy đường dẫn ảnh vừa chụp
  return response.assets?.[0]?.uri || null;
}