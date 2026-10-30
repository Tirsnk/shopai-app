import { BASE_URL } from './api';

export interface ProductItem {
  id: string | number;
  name: string;
  price: string;
  rawPrice: number;
  category: 'gaming' | 'smartwatch' | 'backpack' | string;
  image: string;
  description?: string;
}

export const LOCAL_PRODUCTS: ProductItem[] = [
  // ===== 1. DANH MỤC GAMING & CÔNG NGHỆ =====
  {
    id: '1',
    name: 'Bàn phím cơ Không dây Gaming RGB ShopAI Pro',
    price: '1.250.000 đ',
    rawPrice: 1250000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
    description: 'Switch cơ quang học siêu nhạy, kết nối Bluetooth/Wireless 2.4Ghz, pin dùng liên tục 40 giờ.',
  },
  {
    id: '2',
    name: 'Tai nghe Chụp tai Gaming Surround 7.1 Bass Boost',
    price: '890.000 đ',
    rawPrice: 890000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    description: 'Âm thanh vòm định vị bước chân chuẩn xác, đệm tai bọc da êm ái thoáng khí, có mic khử ồn.',
  },
  {
    id: '3',
    name: 'Chuột Gaming Không Dây Logitech G Pro X Superlight',
    price: '2.890.000 đ',
    rawPrice: 2890000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500',
    description: 'Trọng lượng siêu nhẹ dưới 63g, cảm biến HERO 25K DPI, kết nối Lightspeed độ trễ 1ms.',
  },
  {
    id: '4',
    name: 'Bàn Phím Cơ Custom AKKO 3098B Multi-Modes',
    price: '1.850.000 đ',
    rawPrice: 1850000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500',
    description: 'Keycap PBT Double-Shot bền bỉ, hỗ trợ Hot-swap 5 pin, 3 chế độ kết nối Type-C/BT5.0/2.4Ghz.',
  },
  {
    id: '5',
    name: 'Tay Cầm Chơi Game Không Dây Xbox Series X',
    price: '1.490.000 đ',
    rawPrice: 1490000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500',
    description: 'Thiết kế công thái học chống trượt, cò phản hồi lực chân thực, tương thích PC, Android, iOS.',
  },
  {
    id: '6',
    name: 'Tai Nghe Gaming Không Dây Razer BlackShark V2 Pro',
    price: '2.990.000 đ',
    rawPrice: 2990000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',
    description: 'Driver TriForce Titanium 50mm, mic HyperClear Supercardioid tháo rời, cách âm thụ động đỉnh cao.',
  },
  {
    id: '7',
    name: 'Micro Thu Âm USB Chuyên Nghiệp HyperX SoloCast',
    price: '1.290.000 đ',
    rawPrice: 1290000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500',
    description: 'Cảm biến chạm để tắt tiếng có đèn LED báo hiệu, thu âm định hướng Cardioid rõ ràng, cắm là chạy.',
  },
  {
    id: '8',
    name: 'Loa Thanh Gaming RGB Bluetooth SoundBar',
    price: '650.000 đ',
    rawPrice: 650000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500',
    description: 'Âm bass mạnh mẽ với màng loa kép, dải LED RGB đồng bộ nhịp điệu, kết nối Bluetooth 5.3 và AUX.',
  },
  {
    id: '9',
    name: 'Lót Chuột Cỡ Lớn Gaming Speed RGB 800x300mm',
    price: '250.000 đ',
    rawPrice: 250000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=500',
    description: 'Bề mặt vải dệt siêu mịn lướt chuột tốc độ cao, viền LED RGB 14 chế độ sáng, đế cao su chống trượt.',
  },
  {
    id: '10',
    name: 'Đế Tản Nhiệt Laptop 6 Quạt Siêu Tốc Có Màn Hình LED',
    price: '490.000 đ',
    rawPrice: 490000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500',
    description: '6 quạt làm mát cực êm, điều chỉnh tốc độ gió bằng nút cảm ứng, giá đỡ chống gù tùy chỉnh 7 góc độ.',
  },
  {
    id: '11',
    name: 'Giá Treo Tai Nghe Gaming Kèm Hub USB 3.0 RGB',
    price: '320.000 đ',
    rawPrice: 320000,
    category: 'gaming',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
    description: 'Đế hợp kim nhôm vững chãi, tích hợp 2 cổng USB 3.0 truyền dữ liệu nhanh và cổng âm thanh 3.5mm.',
  },

  // ===== 2. DANH MỤC ĐỒNG HỒ & THIẾT BỊ ĐEO THÔNG MINH =====
  {
    id: '12',
    name: 'Đồng hồ thông minh Smartwatch AMOLED GPS',
    price: '1.650.000 đ',
    rawPrice: 1650000,
    category: 'smartwatch',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    description: 'Màn hình Always-On Display, cảm biến đo nhịp tim/SpO2 liên tục, kháng nước 5ATM đi bơi thoải mái.',
  },
  {
    id: '13',
    name: 'Đồng Hồ Thông Minh Apple Watch SE 2 GPS 40mm',
    price: '5.890.000 đ',
    rawPrice: 5890000,
    category: 'smartwatch',
    image: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=500',
    description: 'Chip S8 SiP xử lý nhanh nhạy, tính năng phát hiện va chạm, theo dõi chu kỳ ngủ và bài tập đa dạng.',
  },
  {
    id: '14',
    name: 'Đồng Hồ Thể Thao Chuyên Nghiệp Garmin Forerunner 55',
    price: '4.690.000 đ',
    rawPrice: 4690000,
    category: 'smartwatch',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500',
    description: 'GPS độc lập bám track chạy bộ cực chuẩn, gợi ý bài tập PacePro, pin dùng đến 2 tuần liên tục.',
  },
  {
    id: '15',
    name: 'Đồng Hồ Thông Minh Samsung Galaxy Watch 6 LTE',
    price: '4.990.000 đ',
    rawPrice: 4990000,
    category: 'smartwatch',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500',
    description: 'Viền xoay cảm ứng siêu mỏng, phân tích thành phần cơ thể BIA, đo điện tâm đồ ECG và huyết áp.',
  },
  {
    id: '16',
    name: 'Vòng Đeo Tay Thông Minh Xiaomi Smart Band 8',
    price: '790.000 đ',
    rawPrice: 790000,
    category: 'smartwatch',
    image: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=500',
    description: 'Màn hình AMOLED 60Hz mượt mà, hơn 150 chế độ thể thao, pin trâu 16 ngày sạc nhanh từ tính.',
  },
  {
    id: '17',
    name: 'Đế Sạc Không Dây 3 Trong 1 Gấp Gọn Đa Năng',
    price: '590.000 đ',
    rawPrice: 590000,
    category: 'smartwatch',
    image: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=500',
    description: 'Sạc đồng thời Điện thoại 15W, Smartwatch và Tai nghe Bluetooth, chuẩn Qi chống quá nhiệt an toàn.',
  },
  {
    id: '18',
    name: 'Dây Đồng Hồ Da Bò Thật Khóa Cánh Bướm 22mm',
    price: '280.000 đ',
    rawPrice: 280000,
    category: 'smartwatch',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500',
    description: 'Chất liệu da bò tự nhiên dẻo dai, chốt thông minh Quick-Release tháo lắp trong 3 giây không cần kìm.',
  },

  // ===== 3. DANH MỤC BALO & TÚI THỜI TRANG =====
  {
    id: '19',
    name: 'Balo Laptop Chống nước Chống sốc 15.6 inch',
    price: '420.000 đ',
    rawPrice: 420000,
    category: 'backpack',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    description: 'Vải Oxford 900D kháng nước tuyệt đối, có ngăn chống sốc đệm dày cho laptop và cổng sạc USB tiện lợi.',
  },
  {
    id: '20',
    name: 'Túi đeo chéo Thể thao Streetwear Mini',
    price: '190.000 đ',
    rawPrice: 190000,
    category: 'backpack',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',
    description: 'Thiết kế nhỏ gọn cá tính, nhiều ngăn chứa điện thoại/ví tiền, dây đeo tùy chỉnh độ dài linh hoạt.',
  },
  {
    id: '21',
    name: 'Balo Laptop Doanh Nhân Khóa Số Chống Trộm 17 inch',
    price: '750.000 đ',
    rawPrice: 750000,
    category: 'backpack',
    image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500',
    description: 'Trang bị khóa số TSA bảo mật cao, đệm lưng lưới thoáng khí chống gù, ngăn laptop riêng biệt.',
  },
  {
    id: '22',
    name: 'Balo Du Lịch Mở Rộng 180 Độ Đa Năng Có Ngăn Giày',
    price: '520.000 đ',
    rawPrice: 520000,
    category: 'backpack',
    image: 'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=500',
    description: 'Khoang chứa đồ như vali mini mở 180 độ, ngăn riêng đựng giày thông khí, chống thấm nước đi mưa.',
  },
  {
    id: '23',
    name: 'Túi Chống Sốc Laptop Chống Rơi Vỡ Tomtoc CornerArmor 14 inch',
    price: '490.000 đ',
    rawPrice: 490000,
    category: 'backpack',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500',
    description: 'Công nghệ đệm góc CornerArmor đạt chuẩn quân đội Mỹ, lớp nhung mềm mịn chống trầy xước viền máy.',
  },
  {
    id: '24',
    name: 'Túi Đeo Chéo Nam Kháng Nước Siêu Nhẹ Urban Street',
    price: '390.000 đ',
    rawPrice: 390000,
    category: 'backpack',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    description: 'Phong cách tối giản hiện đại, khóa kéo tráng chống rò nước, phù hợp đựng máy tính bảng iPad 11 inch.',
  },
  {
    id: '25',
    name: 'Túi Bao Tử Thể Thao Chạy Bộ Chống Nước Dạ Quang',
    price: '180.000 đ',
    rawPrice: 180000,
    category: 'backpack',
    image: 'https://images.unsplash.com/photo-1622560481216-f3b392e2197d?w=500',
    description: 'Chất liệu vải Neoprene co giãn ôm sát eo không bị nảy khi vận động, có dải phản quang an toàn ban đêm.',
  },
];

export const getProducts = async (): Promise<ProductItem[]> => {
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
};