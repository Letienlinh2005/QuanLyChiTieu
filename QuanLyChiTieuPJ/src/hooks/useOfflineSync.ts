/**
 * useOfflineSync.ts
 * Hook quản lý trạng thái mạng + tự động sync hàng chờ offline khi có mạng trở lại.
 *
 * Cách dùng:
 *   - Wrap ở App root: <OfflineSyncProvider />
 *   - Ở màn hình thêm giao dịch: dùng `useTaoGiaoDichWithOffline()` thay vì `useTaoGiaoDich()`
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { giaoDichApi } from '../api/giaoDichApi';
import {
  getAllPending, removePending, addPendingGiaoDich, countPending,
} from '../utils/offlineQueue';

// ======= Hook trạng thái mạng =======
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Lấy trạng thái ban đầu
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? true);
    });

    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsub();
  }, []);

  return isOnline;
}

// ======= Hook đếm số giao dịch đang chờ =======
export function usePendingCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const n = await countPending();
    setCount(n);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { count, refresh };
}

// ======= Hook sync tự động khi online =======
export function useAutoSync() {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedCount, setLastSyncedCount] = useState(0);
  const prevOnline = useRef(false);

  const syncNow = useCallback(async () => {
    if (isSyncing) return;

    const pending = await getAllPending();
    if (pending.length === 0) return;

    setIsSyncing(true);
    let synced = 0;
    const failedIds: number[] = [];

    for (const item of pending) {
      try {
        const payload = JSON.parse(item.payload);
        await giaoDichApi.taoMoi(payload);
        await removePending(item.id);
        synced++;
      } catch (err: any) {
        console.warn(`[OfflineSync] Không sync được giao dịch #${item.id}:`, err);
        const status = err?.response?.status;
        // Nếu server từ chối vì lỗi dữ liệu client 4xx (ví dụ ví đã bị xóa, số dư âm, ngày tương lai, sai format):
        // Xóa bản ghi lỗi khỏi hàng chờ để không bị kẹt lặp vô hạn!
        if (status && status >= 400 && status < 500) {
          console.warn(`[OfflineSync] Xóa giao dịch lỗi vĩnh viễn #${item.id} (HTTP ${status}) khỏi hàng chờ.`);
          await removePending(item.id);
        } else {
          failedIds.push(item.id);
        }
      }
    }

    setIsSyncing(false);
    setLastSyncedCount(synced);

    if (synced > 0) {
      // Refresh toàn bộ cache liên quan
      queryClient.invalidateQueries({ queryKey: ['giao-dich'] });
      queryClient.invalidateQueries({ queryKey: ['vi'] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-tong-quan'] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-xu-huong'] });
      queryClient.invalidateQueries({ queryKey: ['bao-cao-nam'] });
      queryClient.invalidateQueries({ queryKey: ['ngan-sach'] });
    }

    return { synced, failed: failedIds.length };
  }, [isSyncing, queryClient]);

  // Tự động sync khi vừa chuyển từ offline → online
  useEffect(() => {
    if (isOnline && !prevOnline.current) {
      syncNow();
    }
    prevOnline.current = isOnline;
  }, [isOnline, syncNow]);

  return { isOnline, isSyncing, lastSyncedCount, syncNow };
}

// ======= Hook thêm giao dịch có hỗ trợ offline =======
export function useTaoGiaoDichWithOffline() {
  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (
      payload: Parameters<typeof giaoDichApi.taoMoi>[0],
      options?: {
        onSuccess?: () => void;
        onOfflineSaved?: () => void;
        onError?: (err: unknown) => void;
      }
    ) => {
      setIsPending(true);
      try {
        if (isOnline) {
          // Có mạng: gửi thẳng lên server
          await giaoDichApi.taoMoi(payload);
          queryClient.invalidateQueries({ queryKey: ['giao-dich', payload.maSoChiTieu] });
          queryClient.invalidateQueries({ queryKey: ['vi', payload.maSoChiTieu] });
          queryClient.invalidateQueries({ queryKey: ['bao-cao-tong-quan', payload.maSoChiTieu] });
          queryClient.invalidateQueries({ queryKey: ['bao-cao-xu-huong', payload.maSoChiTieu] });
          queryClient.invalidateQueries({ queryKey: ['ngan-sach', payload.maSoChiTieu] });
          options?.onSuccess?.();
        } else {
          // Mất mạng: lưu vào SQLite local
          await addPendingGiaoDich(payload);
          options?.onOfflineSaved?.();
        }
      } catch (err: any) {
        // Kiểm tra xem có phải lỗi HTTP client do sai dữ liệu (4xx) không
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500) {
          // Lỗi dữ liệu/validation (ví không thuộc sổ, ngày tương lai, số dư âm...)
          // KHÔNG LƯU vào hàng chờ offline, báo lỗi ngay cho người dùng!
          options?.onError?.(err);
          return;
        }

        // Lỗi mất mạng (Network Error / timeout / không có response) -> fallback lưu offline
        try {
          await addPendingGiaoDich(payload);
          options?.onOfflineSaved?.();
        } catch (dbErr) {
          options?.onError?.(dbErr);
        }
      } finally {
        setIsPending(false);
      }
    },
    [isOnline, queryClient]
  );

  return { mutate, isPending, isOnline };
}
