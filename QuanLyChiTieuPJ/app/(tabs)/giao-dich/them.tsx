import { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../../../src/store/appStore';
import { useVi } from '../../../src/hooks/useVi';
import { useDanhMuc } from '../../../src/hooks/useDanhMuc';
import { useTaoGiaoDichWithOffline } from '../../../src/hooks/useOfflineSync';
import { LoaiGiaoDich } from '../../../src/types/giaoDich';
import { useAppTheme } from '../../../src/store/themeStore';
import Ionicons from '@expo/vector-icons/Ionicons';

const CAC_LOAI_GIAO_DICH: { value: LoaiGiaoDich; label: string }[] = [
  { value: 'Chi', label: 'Chi tiền' },
  { value: 'Thu', label: 'Thu tiền' },
  { value: 'ChuyenKhoan', label: 'Chuyển khoản' },
];

function ngayThanhChuoiIso(date: Date): string {
  const nam = date.getFullYear();
  const thang = String(date.getMonth() + 1).padStart(2, '0');
  const ngay = String(date.getDate()).padStart(2, '0');
  return `${nam}-${thang}-${ngay}`;
}

export default function ThemGiaoDichScreen() {
  const params = useLocalSearchParams<{ loai?: LoaiGiaoDich; viNguon?: string }>();
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { data: danhSachVi } = useVi(maSoChiTieu);
  const taoGiaoDich = useTaoGiaoDichWithOffline();
  const { isDark, colors } = useAppTheme();

  const [loai, setLoai] = useState<LoaiGiaoDich>(params.loai ?? 'Chi');
  const [maVi, setMaVi] = useState<number | null>(params.viNguon ? Number(params.viNguon) : null);
  const [maViDoi, setMaViDoi] = useState<number | null>(null);
  const [maDanhMuc, setMaDanhMuc] = useState<number | null>(null);
  const [soTien, setSoTien] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [ngayGiaoDich, setNgayGiaoDich] = useState(() => new Date());
  const [dangChonNgay, setDangChonNgay] = useState(false);
  const [anhBangChung, setAnhBangChung] = useState<string | null>(null);

  const xuLyDoiNgay = (_event: DateTimePickerChangeEvent, ngay?: Date) => {
    if (ngay) setNgayGiaoDich(ngay);
    if (Platform.OS !== 'ios') setDangChonNgay(false);
  };

  const xuLyDongPicker = () => {
    setDangChonNgay(false);
  };

  const loaiDanhMuc = loai === 'Thu' ? 'Thu' : loai === 'Chi' ? 'Chi' : undefined;
  const { data: danhSachDanhMuc } = useDanhMuc(maSoChiTieu, loaiDanhMuc);

  const viDoiKhaDung = useMemo(
    () => (danhSachVi ?? []).filter((v) => v.maVi !== maVi),
    [danhSachVi, maVi]
  );

  const xuLyDoiLoai = (loaiMoi: LoaiGiaoDich) => {
    setLoai(loaiMoi);
    setMaDanhMuc(null);
    if (loaiMoi !== 'ChuyenKhoan') setMaViDoi(null);
  };

  const chupAnh = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền bị từ chối', 'Cần cấp quyền truy cập camera để chụp ảnh bằng chứng.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAnhBangChung(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const chonTuThuVien = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền bị từ chối', 'Cần cấp quyền truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAnhBangChung(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const hienThiChonAnh = () => {
    Alert.alert('Ảnh bằng chứng', 'Chọn nguồn ảnh', [
      { text: 'Chụp ảnh', onPress: chupAnh },
      { text: 'Chọn từ thư viện', onPress: chonTuThuVien },
      { text: 'Huỷ', style: 'cancel' },
    ]);
  };

  const xuLyLuu = () => {
    const homNay = new Date();
    homNay.setHours(0, 0, 0, 0);
    const ngayDaChon = new Date(ngayGiaoDich);
    ngayDaChon.setHours(0, 0, 0, 0);
    if (ngayDaChon > homNay) {
      Alert.alert('Ngày không hợp lệ', 'Không thể chọn ngày trong tương lai');
      return;
    }
    if (!maSoChiTieu) {
      Alert.alert('Lỗi', 'Chưa xác định được sổ chi tiêu');
      return;
    }
    if (!maVi) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ví');
      return;
    }
    const soTienSo = Number(soTien.replace(/\D/g, ''));
    if (!soTienSo || soTienSo <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (loai === 'ChuyenKhoan' && !maViDoi) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ví nhận tiền');
      return;
    }
    if ((loai === 'Thu' || loai === 'Chi') && !maDanhMuc) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn danh mục');
      return;
    }

    taoGiaoDich.mutate(
      {
        maSoChiTieu,
        maVi,
        maViDoi: loai === 'ChuyenKhoan' ? maViDoi : null,
        maDanhMuc: loai === 'ChuyenKhoan' ? null : maDanhMuc,
        loai,
        soTien: soTienSo,
        ghiChu: ghiChu.trim() || null,
        ngayGiaoDich: ngayThanhChuoiIso(ngayGiaoDich),
        anhBangChung: loai !== 'ChuyenKhoan' ? anhBangChung : null,
      },
      {
        onSuccess: () => router.back(),
        onOfflineSaved: () => {
          Alert.alert(
            '📵 Đã lưu offline',
            'Giao dịch sẽ tự động đồng bộ khi bạn có kết nối mạng trở lại.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        },
        onError: () => Alert.alert('Lỗi', 'Không thể lưu giao dịch, thử lại sau'),
      }
    );
  };

  const chipSelectedStyle = {
    backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
    borderColor: colors.primary,
  };
  const chipSelectedTextStyle = {
    color: isDark ? '#93c5fd' : '#2563eb',
    fontWeight: '600' as const,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.nutBack}>
          <Text style={[styles.chuBack, { color: colors.primary }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {loai === 'ChuyenKhoan' ? 'Chuyển tiền giữa các ví' : 'Thêm giao dịch'}
        </Text>
        <View style={styles.nutBack} />
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Loại giao dịch</Text>
        <View style={styles.chonRow}>
          {CAC_LOAI_GIAO_DICH.map((l) => {
            const isSelected = loai === l.value;
            return (
              <TouchableOpacity
                key={l.value}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && chipSelectedStyle,
                ]}
                onPress={() => xuLyDoiLoai(l.value)}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: colors.text },
                    isSelected && chipSelectedTextStyle,
                  ]}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {loai === 'ChuyenKhoan' ? 'Từ ví (Ví nguồn)' : 'Ví'}
        </Text>
        <View style={styles.chonRow}>
          {(danhSachVi ?? []).map((v) => {
            const isSelected = maVi === v.maVi;
            return (
              <TouchableOpacity
                key={v.maVi}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && chipSelectedStyle,
                ]}
                onPress={() => {
                  setMaVi(v.maVi);
                  if (maViDoi === v.maVi) setMaViDoi(null);
                }}
              >
                <Text style={styles.chipIcon}>{v.bieuTuong}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    { color: colors.text },
                    isSelected && chipSelectedTextStyle,
                  ]}
                >
                  {v.tenVi}
                </Text>
              </TouchableOpacity>
            );
          })}
          {(danhSachVi ?? []).length === 0 && (
            <Text style={[styles.goiY, { color: colors.textMuted }]}>Chưa có ví nào, vào tab Ví để thêm.</Text>
          )}
        </View>

        {loai === 'ChuyenKhoan' && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Đến ví (Ví đích)</Text>
            <View style={styles.chonRow}>
              {viDoiKhaDung.map((v) => {
                const isSelected = maViDoi === v.maVi;
                return (
                  <TouchableOpacity
                    key={v.maVi}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSelected && chipSelectedStyle,
                    ]}
                    onPress={() => setMaViDoi(v.maVi)}
                  >
                    <Text style={styles.chipIcon}>{v.bieuTuong}</Text>
                    <Text
                      style={[
                        styles.chipLabel,
                        { color: colors.text },
                        isSelected && chipSelectedTextStyle,
                      ]}
                    >
                      {v.tenVi}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {viDoiKhaDung.length === 0 && (
                <Text style={[styles.goiY, { color: colors.textMuted }]}>Cần ít nhất 2 ví để chuyển khoản.</Text>
              )}
            </View>
          </>
        )}

        {loai !== 'ChuyenKhoan' && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Danh mục</Text>
            <View style={styles.chonRow}>
              {(danhSachDanhMuc ?? []).map((dm) => {
                const isSelected = maDanhMuc === dm.maDanhMuc;
                return (
                  <TouchableOpacity
                    key={dm.maDanhMuc}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSelected && chipSelectedStyle,
                    ]}
                    onPress={() => setMaDanhMuc(dm.maDanhMuc)}
                  >
                    <Text style={styles.chipIcon}>{dm.bieuTuong}</Text>
                    <Text
                      style={[
                        styles.chipLabel,
                        { color: colors.text },
                        isSelected && chipSelectedTextStyle,
                      ]}
                    >
                      {dm.tenDanhMuc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {(danhSachDanhMuc ?? []).length === 0 && (
                <Text style={[styles.goiY, { color: colors.textMuted }]}>Chưa có danh mục phù hợp.</Text>
              )}
            </View>
          </>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>Số tiền (đ)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          value={soTien}
          onChangeText={setSoTien}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Ngày giao dịch</Text>
        <TouchableOpacity
          style={[styles.datePickerButton, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
          onPress={() => setDangChonNgay(true)}
        >
          <Text style={[styles.datePickerIcon, { color: colors.primary }]}>📅</Text>
          <Text style={[styles.datePickerText, { color: colors.text }]}>
            {String(ngayGiaoDich.getDate()).padStart(2, '0')}/{String(ngayGiaoDich.getMonth() + 1).padStart(2, '0')}/{ngayGiaoDich.getFullYear()}
          </Text>
        </TouchableOpacity>
        {dangChonNgay && (
          <DateTimePicker
            value={ngayGiaoDich}
            maximumDate={new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={xuLyDoiNgay}
            onDismiss={xuLyDongPicker}
          />
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>Ghi chú (không bắt buộc)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder={loai === 'ChuyenKhoan' ? 'VD: Rút tiền mặt từ ATM, nạp tiền vào ví...' : 'VD: Ăn trưa với bạn...'}
          placeholderTextColor={colors.textMuted}
          value={ghiChu}
          onChangeText={setGhiChu}
        />

        {/* Ảnh bằng chứng - chỉ cho giao dịch Thu/Chi */}
        {loai !== 'ChuyenKhoan' && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>📸 Ảnh bằng chứng (không bắt buộc)</Text>
            {anhBangChung ? (
              <View style={styles.anhContainer}>
                <Image source={{ uri: anhBangChung }} style={styles.anhPreview} resizeMode="cover" />
                <View style={styles.anhActions}>
                  <TouchableOpacity
                    style={[styles.anhBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={hienThiChonAnh}
                  >
                    <Ionicons name="camera-outline" size={16} color={colors.primary} />
                    <Text style={[styles.anhBtnText, { color: colors.primary }]}>Đổi ảnh</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.anhBtn, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
                    onPress={() => setAnhBangChung(null)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    <Text style={[styles.anhBtnText, { color: '#dc2626' }]}>Xoá</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.anhChonBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={hienThiChonAnh}
              >
                <Ionicons name="camera-outline" size={24} color={colors.textMuted} />
                <Text style={[styles.anhChonText, { color: colors.textMuted }]}>Chụp hoặc chọn ảnh bằng chứng</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Indicator mạng */}
        {!taoGiaoDich.isOnline && (
          <View style={styles.offlineNote}>
            <Text style={styles.offlineNoteText}>📵 Không có mạng — giao dịch sẽ được lưu offline</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.nutLuu, { backgroundColor: taoGiaoDich.isOnline ? colors.primary : '#64748b' }]}
          onPress={xuLyLuu}
          disabled={taoGiaoDich.isPending}
        >
          <Text style={styles.nutLuuChu}>
            {taoGiaoDich.isPending
              ? 'Đang lưu...'
              : taoGiaoDich.isOnline
              ? (loai === 'ChuyenKhoan' ? 'Xác nhận chuyển tiền' : 'Lưu giao dịch')
              : '💾 Lưu offline'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  nutBack: { minWidth: 70 },
  chuBack: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: 'bold' },
  container: { flex: 1, padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16,
  },
  chonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1,
  },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 13 },
  goiY: { fontStyle: 'italic', fontSize: 13 },
  datePickerButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 8, padding: 14,
  },
  datePickerIcon: { fontSize: 18 },
  datePickerText: { fontSize: 16, fontWeight: '500' },
  // Ảnh bằng chứng
  anhContainer: { gap: 8 },
  anhPreview: { width: '100%', height: 200, borderRadius: 12 },
  anhActions: { flexDirection: 'row', gap: 8 },
  anhBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1,
  },
  anhBtnText: { fontSize: 13, fontWeight: '600' },
  anhChonBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 20, borderRadius: 12, borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  anhChonText: { fontSize: 14 },
  nutLuu: {
    borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 16, marginBottom: 40,
  },
  nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
  offlineNote: {
    backgroundColor: '#fef3c7', borderRadius: 8, padding: 10,
    marginTop: 16, borderWidth: 1, borderColor: '#f59e0b',
  },
  offlineNoteText: { color: '#92400e', fontSize: 13, fontWeight: '500', textAlign: 'center' },
});