import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CartScreen({
  cartItems = [],
  onIncrease = () => {},
  onDecrease = () => {},
  onBack = () => {},
}: {
  cartItems: any[];
  onIncrease: (id: string | number) => void;
  onDecrease: (id: string | number) => void;
  onBack: () => void;
}) {
  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartCard}>
      <Image source={{ uri: item.image }} style={styles.cartImage} />
      <View style={styles.cartInfo}>
        <Text style={styles.cartName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.cartPrice}>{item.price}</Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onDecrease(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={16} color="#333" />
          </TouchableOpacity>

          <Text style={styles.qtyText}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onIncrease(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Tính tổng tiền giỏ hàng an toàn
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.rawPrice || 500000) * item.quantity,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header giỏ hàng */}
      <View style={styles.cartHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.cartScreenTitle}>Giỏ hàng của bạn</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Danh sách sản phẩm trong giỏ */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống!</Text>
          </View>
        }
      />

      {/* Tổng tiền giỏ hàng */}
      {cartItems.length > 0 && (
        <View style={styles.footerContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalValue}>{totalAmount.toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 0,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: { padding: 4 },
  cartScreenTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  listContainer: { padding: 16, paddingBottom: 24 },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    alignItems: 'center',
  },
  cartImage: { width: 70, height: 70, borderRadius: 8, resizeMode: 'cover', marginRight: 12 },
  cartInfo: { flex: 1 },
  cartName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  cartPrice: { fontSize: 14, fontWeight: 'bold', color: '#FF3B30', marginBottom: 8 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  qtyButton: {
    width: 28,
    height: 28,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { marginHorizontal: 12, fontSize: 14, fontWeight: 'bold', color: '#333' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 14, color: '#888' },
  footerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, color: '#666', fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#FF3B30' },
});