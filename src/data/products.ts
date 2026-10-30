// src/data/products.ts

export interface ProductItem {
  id: string | number;
  name: string;
  price: string;
  rawPrice: number;
  category: 'gaming' | 'smartwatch' | 'backpack';
  image: string;
  description: string;
}

export const LOCAL_PRODUCTS: ProductItem[] = [
  {
    id: 'sp_01',
    name: 'Bàn phím cơ Không dây Gaming RGB ShopAI Pro',
    price: '1.250.000 đ',
    rawPrice: 1250000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
    description: 'Switch cơ quang học siêu nhạy, kết nối Bluetooth/Wireless 2.4Ghz, pin dùng liên tục 40 giờ.',
  },
  {
    id: 'sp_02',
    name: 'Tai nghe Chụp tai Gaming Surround 7.1 Bass Boost',
    price: '890.000 đ',
    rawPrice: 890000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    description: 'Âm thanh vòm định vị bước chân chuẩn xác, đệm tai bọc da êm ái thoáng khí, có mic khử ồn.',
  },
  {
    id: 'sp_03',
    name: 'Đồng hồ thông minh Smartwatch AMOLED GPS',
    price: '1.650.000 đ',
    rawPrice: 1650000,
    category: 'smartwatch',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    description: 'Màn hình Always-On Display, cảm biến đo nhịp tim/SpO2 liên tục, kháng nước 5ATM đi bơi thoải mái.',
  },
  {
    id: 'sp_04',
    name: 'Balo Laptop Chống nước Chống sốc 15.6 inch',
    price: '420.000 đ',
    rawPrice: 420000,
    category: 'backpack',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    description: 'Vải Oxford 900D kháng nước tuyệt đối, có ngăn chống sốc đệm dày cho laptop và cổng sạc USB tiện lợi.',
  },
  {
    id: 'sp_05',
    name: 'Túi đeo chéo Thể thao Streetwear Mini',
    price: '190.000 đ',
    rawPrice: 190000,
    category: 'backpack',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',
    description: 'Thiết kế nhỏ gọn cá tính, nhiều ngăn chứa điện thoại/ví tiền, dây đeo tùy chỉnh độ dài linh hoạt.',
  },
];