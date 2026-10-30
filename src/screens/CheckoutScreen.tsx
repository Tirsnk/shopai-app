import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCartStore, useOrderStore } from '../../App';
import { BASE_URL } from '../services/api';

interface CheckoutScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function CheckoutScreen({ onBack, onComplete }: CheckoutScreenProps) {
  const { cartItems, getTotalPrice, clearCart, shippingFee } = useCartStore();
  const createOrder = useOrderStore((s) => s.createOrder);

  // 1. TÍNH TOÁN DÒNG TIỀN (TIỀN HÀNG + PHÍ SHIP GPS)
  const subTotal = getTotalPrice();
  const currentShippingFee = shippingFee || 30000;
  const finalTotal = subTotal + currentShippingFee;

  // 2. STATE THANH TOÁN & TIẾN TRÌNH API
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [showQrModal, setShowQrModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [lockedAmount, setLockedAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // 3. XỬ LÝ ĐẶT HÀNG & GỬI DỮ LIỆU LÊN SERVER NESTJS
  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng đang trống!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Chuyển đổi mã sản phẩm sang kiểu số nguyên hợp lệ cho Database SQLite
      const payloadItems = cartItems.map((item: any) => {
        const parsedId = parseInt(item.id, 10);
        return {
          productId: !isNaN(parsedId) ? parsedId : 1,
          quantity: item.quantity,
        };
      });

      // 1. Gửi request POST /orders lên NestJS để lưu vào SQLite
      const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: payloadItems,
          shippingFee: currentShippingFee,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || `Mã lỗi máy chủ: ${response.status}`);
      }

      const result = await response.json();
      const serverOrder = result.order;
      const orderId = serverOrder.id; // Mã thật từ SQLite (ví dụ: ORD-123456)
      const totalToPay = serverOrder.totalPrice || finalTotal;

      setCreatedOrderId(orderId);
      setLockedAmount(totalToPay);

      if (createOrder) {
        createOrder(cartItems, totalToPay);
      }

      if (paymentMethod === 'CASH') {
        clearCart();
        Alert.alert(
          'Đặt hàng thành công 🎉',
          `Mã đơn hàng: #${orderId}\n\n• Tiền hàng: ${subTotal.toLocaleString('vi-VN')} đ\n• Phí vận chuyển (GPS): ${currentShippingFee.toLocaleString('vi-VN')} đ\n-------------------------\n👉 Tổng thanh toán: ${totalToPay.toLocaleString('vi-VN')} đ\n\nBạn sẽ thanh toán tiền mặt khi shipper giao hàng tận nơi.`,
          [{ text: 'Xem đơn hàng', onPress: onComplete }]
        );
      } else {
        // Mở Modal hiển thị mã VietQR MBBank
        setShowQrModal(true);
      }
    } catch (error: any) {
      console.error('Lỗi gửi đơn lên Backend NestJS:', error);
      Alert.alert(
        'Lỗi đặt hàng',
        error?.message || 'Không thể kết nối đến máy chủ NestJS. Vui lòng kiểm tra server backend đã bật!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. XÁC NHẬN CHUYỂN KHOẢN (CẬP NHẬT TRẠNG THÁI SANG PAID TRÊN SQLITE)
  const handleFinishPayment = async () => {
    setIsPaying(true);
    try {
      if (createdOrderId) {
        // Gửi request POST /orders/:id/pay để cập nhật trạng thái đơn thành PAID
        await fetch(`${BASE_URL}/orders/${createdOrderId}/pay`, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.warn('Lỗi cập nhật trạng thái PAID:', error);
    } finally {
      setIsPaying(false);
      clearCart();
      setShowQrModal(false);
      Alert.alert(
        'Thành công 🎉',
        `Đã ghi nhận thanh toán ${qrAmount.toLocaleString('vi-VN')} đ cho đơn hàng #${createdOrderId}!`,
        [{ text: 'Xem đơn hàng', onPress: onComplete }]
      );
    }
  };

  // Link VietQR MBBank: Luôn lấy lockedAmount cố định từ đơn hàng
  const qrAmount = lockedAmount > 0 ? lockedAmount : finalTotal;
  const qrUrl = `https://img.vietqr.io/image/MB-0352091057-compact2.png?amount=${qrAmount}&addInfo=DH%20${createdOrderId}&accountName=LA%20VAN%20TRI`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonIcon}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.subHeaderTitle}>Thanh toán đơn hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Địa chỉ nhận hàng */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="location-outline" size={20} color="#0F766E" />
            <Text style={styles.cardHeaderTitle}>Địa chỉ nhận hàng</Text>
          </View>
          <Text style={styles.addressName}>La Văn Trí - 0352091057</Text>
          <Text style={styles.addressDetail}>
            Ký túc xá Đại học Công Nghiệp TP.HCM (IUH), Gò Vấp, TP.HCM
          </Text>
        </View>

        {/* Danh sách sản phẩm */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Sản phẩm đặt mua ({cartItems.length})</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.productRow}>
              <Image source={{ uri: item.image }} style={styles.productThumb} resizeMode="contain" />
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.productQty}>Số lượng: x{item.quantity}</Text>
              </View>
              <Text style={styles.productPrice}>{item.price}</Text>
            </View>
          ))}
        </View>

        {/* Phương thức thanh toán */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Phương thức thanh toán</Text>

          {/* Tiền mặt (COD) */}
          <TouchableOpacity
            style={[styles.methodOption, paymentMethod === 'CASH' && styles.methodOptionActive]}
            onPress={() => setPaymentMethod('CASH')}
            activeOpacity={0.7}
          >
            <View style={styles.methodInfo}>
              <Ionicons name="cash-outline" size={24} color="#0F766E" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.methodTitle}>Thanh toán tiền mặt</Text>
                <Text style={styles.methodSubtitle}>Trả tiền khi nhận hàng (COD)</Text>
              </View>
            </View>
            <Ionicons
              name={paymentMethod === 'CASH' ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={paymentMethod === 'CASH' ? '#0F766E' : '#94A3B8'}
            />
          </TouchableOpacity>

          {/* Quét mã QR */}
          <TouchableOpacity
            style={[styles.methodOption, paymentMethod === 'QR' && styles.methodOptionActive]}
            onPress={() => setPaymentMethod('QR')}
            activeOpacity={0.7}
          >
            <View style={styles.methodInfo}>
              <Ionicons name="qr-code-outline" size={24} color="#007AFF" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.methodTitle}>Chuyển khoản QR ngân hàng</Text>
                <Text style={styles.methodSubtitle}>MBBank - 0352091057 (Tự động điền tiền)</Text>
              </View>
            </View>
            <Ionicons
              name={paymentMethod === 'QR' ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={paymentMethod === 'QR' ? '#0F766E' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>

        {/* Bảng kê chi tiết thanh toán */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Chi tiết thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiền hàng:</Text>
            <Text style={styles.summaryValue}>{subTotal.toLocaleString('vi-VN')} đ</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển (GPS):</Text>
            <Text style={styles.summaryValue}>+{currentShippingFee.toLocaleString('vi-VN')} đ</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalValue}>{finalTotal.toLocaleString('vi-VN')} đ</Text>
          </View>
          <Text style={styles.noteText}>
            *(Gồm {subTotal.toLocaleString('vi-VN')} đ tiền hàng + {currentShippingFee.toLocaleString('vi-VN')} đ phí ship)*
          </Text>
        </View>
      </ScrollView>

      {/* Thanh Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>Tổng thanh toán</Text>
          <Text style={styles.bottomTotalPrice}>{finalTotal.toLocaleString('vi-VN')} đ</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleConfirmOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>Xác nhận đặt hàng</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Quét Mã QR MBBank */}
      <Modal visible={showQrModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quét mã QR thanh toán</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowQrModal(false);
                  onComplete();
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Ảnh mã VietQR nạp đúng tổng tiền và mã đơn từ NestJS */}
            <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />

            <View style={styles.bankInfoBox}>
              <Text style={styles.bankInfoRow}>
                <Text style={{ fontWeight: 'bold' }}>Ngân hàng: </Text>MBBank (Quân Đội)
              </Text>
              <Text style={styles.bankInfoRow}>
                <Text style={{ fontWeight: 'bold' }}>Số tài khoản: </Text>
                <Text style={{ color: '#0F766E', fontWeight: 'bold', fontSize: 16 }}>0352091057</Text>
              </Text>
              <Text style={styles.bankInfoRow}>
                <Text style={{ fontWeight: 'bold' }}>Chủ tài khoản: </Text>LA VAN TRI
              </Text>
              <Text style={styles.bankInfoRow}>
                <Text style={{ fontWeight: 'bold' }}>Tổng tiền chuyển: </Text>
                <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 16 }}>
                  {qrAmount.toLocaleString('vi-VN')} đ
                </Text>
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                (Đã gồm {subTotal.toLocaleString('vi-VN')} đ tiền hàng + {currentShippingFee.toLocaleString('vi-VN')} đ phí ship GPS)
              </Text>
              <Text style={[styles.bankInfoRow, { marginTop: 4 }]}>
                <Text style={{ fontWeight: 'bold' }}>Nội dung CK: </Text>DH {createdOrderId}
              </Text>
            </View>

            {/* Nút bấm cập nhật PAID sang SQLite và hoàn tất */}
            <TouchableOpacity
              style={[styles.modalFinishBtn, isPaying && { opacity: 0.7 }]}
              onPress={handleFinishPayment}
              disabled={isPaying}
            >
              {isPaying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalFinishText}>Tôi đã chuyển khoản xong</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  subHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  backButtonIcon: { padding: 4 },
  content: { flex: 1, padding: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardHeaderTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginLeft: 6 },
  addressName: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 2 },
  addressDetail: { fontSize: 13, color: '#64748B' },
  productRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  productThumb: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#f9f9f9' },
  productName: { fontSize: 13, fontWeight: '600', color: '#334155' },
  productQty: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  productPrice: { fontSize: 13, fontWeight: 'bold', color: '#0F766E' },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  methodOptionActive: { borderColor: '#0F766E', backgroundColor: '#F0FDFA' },
  methodInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  methodTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  methodSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  summaryLabel: { fontSize: 13, color: '#64748B' },
  summaryValue: { fontSize: 13, fontWeight: '500', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#FF3B30' },
  noteText: { fontSize: 11, color: '#64748B', fontStyle: 'italic', marginTop: 4, textAlign: 'right' },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  bottomTotalLabel: { fontSize: 12, color: '#64748B' },
  bottomTotalPrice: { fontSize: 18, fontWeight: 'bold', color: '#FF3B30' },
  confirmBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E293B' },
  qrImage: { width: 220, height: 220, marginVertical: 8 },
  bankInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
  },
  bankInfoRow: { fontSize: 13, color: '#334155', marginVertical: 2 },
  modalFinishBtn: {
    backgroundColor: '#0F766E',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  modalFinishText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});