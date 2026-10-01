/**
 * OfflineBanner.tsx
 * Banner hiển thị ở trên cùng khi mất mạng hoặc đang sync.
 * Dùng Animated để slide-in / slide-out mượt mà.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAutoSync, usePendingCount } from '../src/hooks/useOfflineSync';
import { useAppTheme } from '../src/store/themeStore';

export default function OfflineBanner() {
  const { isOnline, isSyncing, lastSyncedCount, syncNow } = useAutoSync();
  const { count: pendingCount, refresh: refreshCount } = usePendingCount();
  const { colors } = useAppTheme();

  // Refresh số pending sau mỗi lần sync
  useEffect(() => {
    if (!isSyncing) refreshCount();
  }, [isSyncing, lastSyncedCount]);

  const slideY = useRef(new Animated.Value(-60)).current;
  // Track giá trị numeric của animation để dùng trong điều kiện return null
  const slideYValue = useRef(-60);

  useEffect(() => {
    const listenerId = slideY.addListener(({ value }) => {
      slideYValue.current = value;
    });
    return () => slideY.removeListener(listenerId);
  }, [slideY]);

  const shouldShow = !isOnline || isSyncing || (isOnline && pendingCount > 0);

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: shouldShow ? 0 : -60,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [shouldShow]);

  if (!shouldShow && slideYValue.current < -55) return null;

  const bgColor = !isOnline ? '#dc2626' : isSyncing ? '#f59e0b' : '#10b981';

  const message = !isOnline
    ? `📵 Mất kết nối${pendingCount > 0 ? ` — ${pendingCount} giao dịch chờ sync` : ''}`
    : isSyncing
    ? `🔄 Đang đồng bộ ${pendingCount} giao dịch...`
    : `✅ Đã sync ${lastSyncedCount} giao dịch`;

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bgColor, transform: [{ translateY: slideY }] }]}>
      <Text style={styles.text}>{message}</Text>
      {isOnline && pendingCount > 0 && !isSyncing && (
        <TouchableOpacity onPress={syncNow} style={styles.syncBtn}>
          <Text style={styles.syncBtnText}>Sync ngay</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 50, // safe area top
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  syncBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8,
  },
  syncBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
