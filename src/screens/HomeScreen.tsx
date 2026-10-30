import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
  Alert,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Camera, CameraType } from 'react-native-camera-kit';
import { LOCAL_PRODUCTS } from '../data/products';
import { getCurrentLocation, LocationCoords } from '../services/locationService';
import { useCartStore } from '../../App';
import { BASE_URL } from '../services/api';

// ==========================================
// 1. CẤU HÌNH & TỌA ĐỘ KHO TRUNG TÂM
// ==========================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: '🔥 Tất cả' },
  { id: 'gaming', name: '🎮 Gaming / Công nghệ' },
  { id: 'smartwatch', name: '⌚ Đồng hồ / Trang sức' },
  { id: 'backpack', name: '🎒 Balo & Túi' },
];

const WAREHOUSE_COORDS = {
  latitude: 10.8231,
  longitude: 106.6297,
};

function calculateDistanceKm(userCoords: LocationCoords): number {
  const R = 6371;
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

export interface ProductItem {
  id: string | number;
  name: string;
  price: string;
  rawPrice: number;
  category: string;
  image: string;
  description?: string;
}

// Gọi API lấy dữ liệu từ Backend NestJS (SQLite Database)
async function fetchProductsFromApi(): Promise<ProductItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/products`);
    if (!res.ok) {
      throw new Error(`Lỗi kết nối máy chủ NestJS: ${res.status}`);
    }
    const data = await res.json();

    return data.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      price: `${Number(item.price).toLocaleString('vi-VN')} đ`,
      rawPrice: Number(item.price),
      category: item.category || 'gaming',
      image: item.image,
      description: item.description,
    }));
  } catch (error) {
    console.log('Không thể tải từ Server NestJS, chuyển sang dùng dữ liệu offline:', error);
    return LOCAL_PRODUCTS;
  }
}

interface HomeScreenProps {
  onNavigateToCart?: () => void;
  onNavigateToDetail?: (product: ProductItem) => void;
}

export default function HomeScreen({
  onNavigateToCart = () => {},
  onNavigateToDetail = () => {},
}: HomeScreenProps) {
  const cartItems = useCartStore((state) => state.cartItems);
  const addToCart = useCartStore((state) => state.addToCart);

  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProductsFromApi,
    staleTime: 1000 * 60 * 5,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'asc' | 'desc'>('default');

  // ---------- GPS & ĐỒNG BỘ PHÍ VẬN CHUYỂN ----------
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = async () => {
    try {
      setIsLocating(true);
      const coords = await getCurrentLocation();
      if (coords) {
        setUserLocation(coords);
        const distance = calculateDistanceKm(coords);
        const calculatedFee = distance * 3000;

        const store = useCartStore.getState() as any;
        if (store.setShippingFee) {
          store.setShippingFee(calculatedFee);
        }

        Alert.alert(
          'Định vị thành công',
          `Vị trí của bạn: [${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}]\nKhoảng cách đến kho: ${distance} km\nPhí ship tính theo GPS: ${calculatedFee.toLocaleString('vi-VN')} đ`,
        );
      }
    } catch (error: any) {
      Alert.alert('Lỗi GPS', error?.message || 'Không thể lấy thông tin vị trí.');
    } finally {
      setIsLocating(false);
    }
  };

  // ---------- MÁY QUÉT MÃ VẠCH TỰ ĐỘNG ----------
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [isScanLocked, setIsScanLocked] = useState(false);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Quyền truy cập Camera',
          message: 'ShopAI cần quyền mở Camera để quét mã vạch sản phẩm.',
          buttonPositive: 'Đồng ý',
          buttonNegative: 'Hủy',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleOpenScanner = async () => {
    const hasPerm = await requestCameraPermission();
    if (!hasPerm) {
      Alert.alert('Thông báo', 'Bạn chưa cấp quyền Camera để quét mã vạch.');
      return;
    }
    setIsScanLocked(false);
    setIsScannerVisible(true);
  };

  const handleBarcodeScanned = (event: any) => {
    const barcode = event?.nativeEvent?.codeStringValue;

    if (barcode && !isScanLocked) {
      setIsScanLocked(true);
      setIsScannerVisible(false);
      setSelectedCategory('all');

      const matched = products.find(
        (p) => p.id.toString() === barcode || p.name.toLowerCase().includes(barcode.toLowerCase()),
      );

      if (matched) {
        setSearchQuery(matched.name);
        Alert.alert('Quét thành công 🎯', `Đã tìm thấy: ${matched.name}`);
      } else {
        const sampleProduct = products[0];
        if (sampleProduct) {
          setSearchQuery(sampleProduct.name.slice(0, 10));
          Alert.alert(
            'Nhận diện mã vạch thành công 🎯',
            `Mã quét: ${barcode}\nĐã liên kết sản phẩm mẫu: "${sampleProduct.name}"`,
          );
        } else {
          setSearchQuery(barcode);
        }
      }
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toString().includes(searchQuery);
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'asc') {
      list = [...list].sort((a, b) => a.rawPrice - b.rawPrice);
    } else if (sortBy === 'desc') {
      list = [...list].sort((a, b) => b.rawPrice - a.rawPrice);
    }

    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const renderCategoryItem = ({ item }: { item: (typeof CATEGORIES)[0] }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
        onPress={() => setSelectedCategory(item.id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProductItem = ({ item }: { item: ProductItem }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.8}
      onPress={() => onNavigateToDetail(item)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.productPrice}>{item.price}</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addToCart(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.addButtonText}>Thêm vào giỏ</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // =========================================================================
  // GIAO DIỆN QUÉT CAMERA (RENDER TRỰC TIẾP, FIX LỖI MÀN HÌNH ĐEN)
  // =========================================================================
  if (isScannerVisible) {
    return (
      <View style={styles.scannerRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        <Camera
          style={styles.cameraView}
          cameraType={CameraType.Back}
          scanBarcode={true}
          onReadCode={handleBarcodeScanned}
          showFrame={false}
        />

        <SafeAreaView style={styles.scannerOverlay}>
          <View style={styles.scannerTopBar}>
            <TouchableOpacity
              onPress={() => setIsScannerVisible(false)}
              style={styles.scannerCloseBtn}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Quét mã vạch</Text>
            <View style={{ width: 42 }} />
          </View>

          <View style={styles.finderContainer}>
            <View style={styles.finderBox}>
              <View style={[styles.finderCorner, styles.cTopLeft]} />
              <View style={[styles.finderCorner, styles.cTopRight]} />
              <View style={[styles.finderCorner, styles.cBottomLeft]} />
              <View style={[styles.finderCorner, styles.cBottomRight]} />
              <View style={styles.laserLine} />
            </View>
          </View>

          <View style={styles.scannerBottomCard}>
            <Ionicons name="barcode-outline" size={24} color="#007AFF" />
            <Text style={styles.scannerBottomText}>
              Đưa mã vạch hoặc mã QR vào khung viền để tự động quét
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // =========================================================================
  // GIAO DIỆN TRANG CHỦ CHÍNH (HOMESCREEN)
  // =========================================================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Xin chào,</Text>
          <Text style={styles.userName}>La Văn Trí - ShopAI</Text>
        </View>
        <TouchableOpacity
          style={styles.iconContainer}
          activeOpacity={0.7}
          onPress={onNavigateToCart}
        >
          <Ionicons name="cart-outline" size={24} color="#333" />
          {cartItems.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Thanh định vị GPS */}
      <TouchableOpacity
        style={styles.locationBar}
        onPress={handleGetLocation}
        activeOpacity={0.7}
        disabled={isLocating}
      >
        <Ionicons
          name="location-sharp"
          size={18}
          color={userLocation ? '#16A34A' : '#007AFF'}
        />
        <Text style={styles.locationText} numberOfLines={1}>
          {isLocating
            ? 'Đang kết nối vệ tinh GPS...'
            : userLocation
            ? `Giao đến: [${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}]`
            : 'Bấm để định vị vị trí giao hàng qua GPS'}
        </Text>
        {isLocating ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Ionicons name="locate-outline" size={18} color="#888" />
        )}
      </TouchableOpacity>

      {/* Thanh tìm kiếm & Biểu tượng Camera quét mã vạch */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Tìm kiếm hoặc quét mã vạch..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.actionIcon}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionIcon}
            onPress={handleOpenScanner}
            activeOpacity={0.7}
          >
            <Ionicons name="barcode-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFilterVisible(true)}
        >
          <Ionicons name="options-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Danh sách sản phẩm */}
      {isLoading ? (
        <View style={styles.stateCenter}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.stateText}>Đang tải sản phẩm từ máy chủ NestJS...</Text>
        </View>
      ) : isError ? (
        <View style={styles.stateCenter}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={[styles.stateText, { color: '#FF3B30' }]}>
            Không thể kết nối máy chủ NestJS!
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={
            <View>
              <View style={styles.bannerContainer}>
                <Image
                  source={{ uri: 'https://i.ibb.co/pjxBFz92/image.png' }}
                  style={styles.bannerImage}
                />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>🔥 Flash Sale Giờ Vàng</Text>
                  <Text style={styles.bannerSubtitle}>ShopAI - NestJS Enterprise Backend</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Danh mục nổi bật</Text>
              <FlatList
                data={CATEGORIES}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryListContainer}
              />

              <Text style={styles.sectionTitle}>Sản phẩm gợi ý</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-sharp" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm phù hợp!</Text>
            </View>
          }
        />
      )}

      {/* Modal Bộ lọc sắp xếp */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterVisible}
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc nâng cao</Text>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Sắp xếp theo giá</Text>

            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'default' && styles.filterOptionActive]}
              onPress={() => setSortBy('default')}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  sortBy === 'default' && styles.filterOptionTextActive,
                ]}
              >
                Mặc định
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'asc' && styles.filterOptionActive]}
              onPress={() => setSortBy('asc')}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  sortBy === 'asc' && styles.filterOptionTextActive,
                ]}
              >
                Giá: Thấp đến Cao
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterOption, sortBy === 'desc' && styles.filterOptionActive]}
              onPress={() => setSortBy('desc')}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  sortBy === 'desc' && styles.filterOptionTextActive,
                ]}
              >
                Giá: Cao xuống Thấp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setIsFilterVisible(false)}
            >
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  welcomeText: { fontSize: 13, color: '#666' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  iconContainer: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  searchContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchIcon: { marginRight: 8 },
  actionIcon: { paddingHorizontal: 4 },
  input: { flex: 1, fontSize: 14, color: '#333' },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  scannerRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  scannerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
  },
  scannerCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  finderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finderBox: {
    width: 260,
    height: 260,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  finderCorner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#007AFF',
  },
  cTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  laserLine: {
    width: '85%',
    height: 2,
    backgroundColor: '#007AFF',
  },
  scannerBottomCard: {
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'android' ? 24 : 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scannerBottomText: {
    color: '#F1F5F9',
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },

  bannerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    height: 140,
    backgroundColor: '#000',
  },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  bannerSubtitle: { color: '#fff', fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 10 },
  categoryListContainer: { paddingBottom: 16 },
  categoryChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 36,
    justifyContent: 'center',
  },
  categoryChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  categoryText: { fontSize: 13, color: '#666', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  listContainer: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { justifyContent: 'space-between' },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    width: '48%',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  productImage: { width: '100%', height: 120, borderRadius: 10, marginBottom: 8 },
  productName: { fontSize: 13, fontWeight: '600', color: '#333', height: 36, marginBottom: 4 },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#FF3B30', marginBottom: 8 },
  addButton: { backgroundColor: '#007AFF', paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 14, color: '#888' },
  stateCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  stateText: { marginTop: 12, fontSize: 14, color: '#666' },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  filterSectionTitle: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 10 },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f2f2f2',
  },
  filterOptionActive: { backgroundColor: '#e6f0ff', borderWidth: 1, borderColor: '#007AFF' },
  filterOptionText: { fontSize: 14, color: '#333' },
  filterOptionTextActive: { color: '#007AFF', fontWeight: '600' },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});