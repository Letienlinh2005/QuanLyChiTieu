import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '../../src/store/appStore';
import { useVi } from '../../src/hooks/useVi';
import { useSoChiTieuCuaToi, useLoiMoiDen } from '../../src/hooks/useSoChiTieu';
import { useAppTheme } from '../../src/store/themeStore';
import { formatCurrency } from '../../src/utils/formatCurrency';

export default function TrangChuScreen() {
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const chonSoChiTieu = useAppStore((s) => s.chonSoChiTieu);

  const { data: danhSachVi, isLoading, isError, refetch } = useVi(maSoChiTieu);
  const { data: danhSachSo = [], refetch: refetchSo } = useSoChiTieuCuaToi();
  const { data: loiMoiDen = [] } = useLoiMoiDen();
  const { isDark, colors } = useAppTheme();

  const [modalDoiSo, setModalDoiSo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (maSoChiTieu) {
        refetch();
      }
      refetchSo();
    }, [maSoChiTieu, refetch, refetchSo])
  );

  const soHienTai = danhSachSo.find((s) => s.MaSoChiTieu === maSoChiTieu);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.trangThai, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.trangThai, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textMuted }}>Không tải được dữ liệu. Kiểm tra kết nối mạng.</Text>
      </SafeAreaView>
    );
  }

  const danhSach = danhSachVi ?? [];
  const tongSoDu = danhSach.reduce((tong, vi) => tong + vi.soDuBanDau, 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Thanh chọn Sổ Chi Tiêu */}
      <View style={[styles.headerBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.soSelector}
          onPress={() => setModalDoiSo(true)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>
            {soHienTai?.LoaiSo === 'GiaDinh' ? '👨‍👩‍👧‍👦' : '👤'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.soSelectorSub, { color: colors.textMuted }]}>
              {soHienTai?.LoaiSo === 'GiaDinh' ? 'SỔ GIA ĐÌNH' : 'SỔ CÁ NHÂN'}
            </Text>
            <Text style={[styles.soSelectorName, { color: colors.text }]} numberOfLines={1}>
              {soHienTai?.TenSo || 'Chọn sổ chi tiêu'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnThanhVien, { backgroundColor: colors.primarySubtle }]}
          onPress={() => router.push('/thanh-vien')}
        >
          <Ionicons name="people" size={18} color={colors.primary} />
          {loiMoiDen.length > 0 && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Banner nếu nhận được lời mời gia đình */}
        {loiMoiDen.length > 0 && (
          <TouchableOpacity
            style={[styles.bannerLoiMoi, { backgroundColor: isDark ? '#292524' : '#fef3c7', borderColor: '#f59e0b' }]}
            onPress={() => router.push('/thanh-vien')}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-unread" size={22} color="#f59e0b" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 13 }}>
                Bạn có {loiMoiDen.length} lời mời tham gia sổ gia đình!
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
                Chạm vào đây để xem và chấp nhận lời mời
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
          </TouchableOpacity>
        )}

        {/* Tổng quan số dư */}
        <View
          style={[
            styles.tongQuanCard,
            {
              backgroundColor: isDark ? '#1e3a8a' : '#2563eb',
              borderColor: isDark ? '#2563eb' : 'transparent',
              borderWidth: isDark ? 1 : 0,
            },
          ]}
        >
          <Text style={styles.tongQuanLabel}>Tổng số dư ({soHienTai?.TenSo || 'Sổ'})</Text>
          <Text style={styles.tongQuanSoTien}>{formatCurrency(tongSoDu)}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ví của bạn</Text>
        {danhSach.length === 0 ? (
          <Text style={[styles.rongText, { color: colors.textMuted }]}>
            Chưa có ví nào trong sổ này. Vào tab Ví để thêm mới.
          </Text>
        ) : (
          <View style={styles.viRow}>
            {danhSach.map((vi) => (
              <View
                key={vi.maVi}
                style={[
                  styles.viCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={styles.viIcon}>{vi.bieuTuong}</Text>
                <Text style={[styles.viTen, { color: colors.textMuted }]} numberOfLines={1}>
                  {vi.tenVi}
                </Text>
                <Text style={[styles.viSoDu, { color: colors.text }]}>
                  {formatCurrency(vi.soDuBanDau)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal chọn sổ chi tiêu */}
      <Modal
        visible={modalDoiSo}
        transparent
        animationType="fade"
        onRequestClose={() => setModalDoiSo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chọn Sổ Chi Tiêu</Text>
              <TouchableOpacity onPress={() => setModalDoiSo(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {danhSachSo.map((s) => {
                const dangChon = s.MaSoChiTieu === maSoChiTieu;
                return (
                  <TouchableOpacity
                    key={s.MaSoChiTieu}
                    style={[
                      styles.itemSo,
                      {
                        backgroundColor: dangChon ? colors.primarySubtle : colors.cardSubtle,
                        borderColor: dangChon ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      chonSoChiTieu(s.MaSoChiTieu);
                      setModalDoiSo(false);
                    }}
                  >
                    <Text style={{ fontSize: 24, marginRight: 12 }}>
                      {s.LoaiSo === 'GiaDinh' ? '👨‍👩‍👧‍👦' : '👤'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTenSo, { color: colors.text }]}>{s.TenSo}</Text>
                      <Text style={[styles.itemLoaiSo, { color: colors.textMuted }]}>
                        {s.LoaiSo === 'GiaDinh' ? 'Gia đình / Nhóm' : 'Cá nhân'} • Vai trò:{' '}
                        {s.VaiTro === 'ChuSo' ? 'Chủ sổ' : 'Thành viên'}
                      </Text>
                    </View>
                    {dangChon && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  soSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  soSelectorSub: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  soSelectorName: { fontSize: 15, fontWeight: '700' },
  btnThanhVien: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  bannerLoiMoi: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  container: { flex: 1, padding: 16 },
  trangThai: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tongQuanCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  tongQuanLabel: { color: '#dbeafe', fontSize: 14 },
  tongQuanSoTien: { color: '#fff', fontSize: 30, fontWeight: 'bold', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  rongText: { fontStyle: 'italic' },
  viRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  viCard: {
    flexBasis: '30%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  viIcon: { fontSize: 22 },
  viTen: { fontSize: 13, marginTop: 6 },
  viSoDu: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  itemSo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemTenSo: { fontSize: 15, fontWeight: '700' },
  itemLoaiSo: { fontSize: 12, marginTop: 2 },
});