import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Nhờ cấu hình Alias ở Bước 3,4, ta import cực kỳ ngắn gọn
import HomeScreen from '@screens/HomeScreen';

function App(): React.JSX.Element {
  return (
    // SafeAreaProvider bọc ngoài cùng để tính toán phần "Tai thỏ" (Notch) trên iPhone
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}

export default App;