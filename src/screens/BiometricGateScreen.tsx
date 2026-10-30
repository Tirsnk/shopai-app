// src/screens/BiometricGateScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

interface BiometricGateScreenProps {
  onUnlockSuccess: () => void;
  onFallbackLogin?: () => void;
}

export const BiometricGateScreen: React.FC<BiometricGateScreenProps> = ({
  onUnlockSuccess,
  onFallbackLogin,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isHardwareAvailable, setIsHardwareAvailable] = useState<boolean | null>(null);
  const [sensorName, setSensorName] = useState<string>('Vân tay / Face ID');

  const rnBiometrics = new ReactNativeBiometrics();

  // 👉 BƯỚC 2: Kiểm tra phần cứng ngay khi màn hình vừa mở
  useEffect(() => {
    checkBiometricHardware();
  }, []);

  const checkBiometricHardware = async () => {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();

      if (available && biometryType) {
        setIsHardwareAvailable(true);

        // Đặt tên phù hợp theo cảm biến của từng máy
        if (biometryType === BiometryTypes.FaceID) {
          setSensorName('Face ID');
        } else if (biometryType === BiometryTypes.TouchID) {
          setSensorName('Touch ID');
        } else {
          setSensorName('Vân tay');
        }

        // Tự động bật popup quét luôn cho tiện lợi khi vừa mở app
        setTimeout(() => {
          handleAuthenticate();
        }, 300);
      } else {
        setIsHardwareAvailable(false);
        console.log('Thiết bị không hỗ trợ hoặc chưa cài vân tay trong Cài đặt máy');
      }
    } catch (error) {
      console.log('Lỗi kiểm tra cảm biến sinh trắc học:', error);
      setIsHardwareAvailable(false);
    }
  };

  // Gọi popup hệ thống quét Vân tay / FaceID
  const handleAuthenticate = async () => {
    if (isChecking) return;
    setIsChecking(true);

    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: `Xác thực ${sensorName} để vào ShopAI`,
        cancelButtonText: 'Dùng mật khẩu',
      });

      if (success) {
        onUnlockSuccess(); // Mở khóa thành công vào ứng dụng
      } else {
        console.log('Người dùng đã bấm hủy quét');
      }
    } catch (error: any) {
      console.log('Lỗi xác thực hoặc quét sai nhiều lần:', error?.message);
      Alert.alert(
        'Xác thực không thành công',
        'Không nhận diện được sinh trắc học hoặc bạn đã bấm hủy. Vui lòng thử lại hoặc đăng nhập bằng mật khẩu.'
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBox}>
        <View style={styles.iconCircle}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        <Text style={styles.title}>ShopAI Security Gate</Text>
        <Text style={styles.subtitle}>
          Vui lòng xác thực {sensorName} để mở khoá phiên làm việc an toàn
        </Text>

        {/* Nút quét sinh trắc học */}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            isHardwareAvailable === false && styles.primaryBtnDisabled,
          ]}
          onPress={handleAuthenticate}
          disabled={isChecking || isHardwareAvailable === false}
        >
          {isChecking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {isHardwareAvailable === false
                ? 'Thiết bị chưa cài ' + sensorName
                : `Quét ${sensorName}`}
            </Text>
          )}
        </TouchableOpacity>

        {/* Nút dự phòng: Dùng mật khẩu tài khoản */}
        <TouchableOpacity
          style={styles.fallbackBtn}
          onPress={onFallbackLogin ? onFallbackLogin : onUnlockSuccess}
        >
          <Text style={styles.fallbackBtnText}>Dùng mật khẩu tài khoản</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentBox: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnDisabled: {
    backgroundColor: '#475569',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackBtn: {
    paddingVertical: 10,
  },
  fallbackBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BiometricGateScreen;