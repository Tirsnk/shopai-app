// src/hooks/useAppLock.ts
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const LOCK_TIMEOUT_MS = 30 * 1000; // Tự khóa lại nếu để app chạy ngầm quá 30s

export function useAppLock() {
  const [isLocked, setIsLocked] = useState<boolean>(true); // Mặc định khóa khi mới khởi động
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      // Khi app chuyển từ active sang background -> ghi nhận thời điểm rời app
      if (
        appState.current === 'active' &&
        nextState.match(/inactive|background/)
      ) {
        backgroundTime.current = Date.now();
      }

      // Khi app quay lại màn hình chính (active)
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        if (backgroundTime.current) {
          const elapsed = Date.now() - backgroundTime.current;
          if (elapsed >= LOCK_TIMEOUT_MS) {
            setIsLocked(true); // Khóa lại bắt quét Face ID / Vân tay
          }
          backgroundTime.current = null;
        }
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return {
    isLocked,
    unlock: () => setIsLocked(false),
    lock: () => setIsLocked(true),
  };
}