import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { CameraScreen } from 'react-native-camera-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (barcodeValue: string) => void;
}

export default function BarcodeScannerModal({
  visible,
  onClose,
  onScanSuccess,
}: BarcodeScannerModalProps) {
  // Cờ chống quét lặp lại liên tục nhiều lần trong 1 giây
  const [hasScanned, setHasScanned] = useState(false);

  const handleBarcodeScanned = (event: any) => {
    // Lấy chuỗi mã vạch từ sự kiện native
    const code = event?.nativeEvent?.codeStringValue;

    if (code && !hasScanned) {
      setHasScanned(true); // Khóa quét để xử lý kết quả
      onScanSuccess(code);
      onClose();

      // Mở lại khả năng quét sau 1.5 giây
      setTimeout(() => {
        setHasScanned(false);
      }, 1500);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header điều khiển */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quét mã vạch sản phẩm</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Màn hình Camera tự động nhận diện mã vạch */}
        <View style={styles.cameraContainer}>
          <CameraScreen
            scanBarcode={true}
            onReadCode={handleBarcodeScanned}
            showFrame={true}
            laserColor="#0F766E"
            frameColor="#007AFF"
            surfaceColor="rgba(0, 0, 0, 0.6)"
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Hướng dẫn người dùng */}
        <View style={styles.bottomInstruction}>
          <Ionicons name="barcode-outline" size={32} color="#fff" />
          <Text style={styles.instructionText}>
            Di chuyển camera đến mã vạch hoặc mã QR trên bao bì sản phẩm để quét tự động.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    zIndex: 10,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  bottomInstruction: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: '#ccc',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});