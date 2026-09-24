import { useMemo, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAppStore } from '../../../src/store/appStore';
import { useVi } from '../../../src/hooks/useVi';
import { useDanhMuc } from '../../../src/hooks/useDanhMuc';
import { useCapNhatGiaoDich, useGiaoDich } from '../../../src/hooks/useGiaoDich';
import { LoaiGiaoDich } from '../../../src/types/giaoDich';
import { useAppTheme } from '../../../src/store/themeStore';

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

export default function SuaGiaoDichScreen() {
  const params = useLocalSearchParams();
  const maGiaoDich = Number(params.id);
  const thangQuery = Number(params.thang) || new Date().getMonth() + 1;
  const namQuery = Number(params.nam) || new Date().getFullYear();

  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { data: danhSachVi } = useVi(maSoChiTieu);
  const { data: danhSachGiaoDich } = useGiaoDich(maSoChiTieu, thangQuery, namQuery);
  const capNhatGiaoDich = useCapNhatGiaoDich(maSoChiTieu);
  const { isDark, colors } = useAppTheme();

  const [loai, setLoai] = useState<LoaiGiaoDich>('Chi');
  const [maVi, setMaVi] = useState<number | null>(null);
  const [maViDoi, setMaViDoi] = useState<number | null>(null);
  const [maDanhMuc, setMaDanhMuc] = useState<number | null>(null);
  const [soTien, setSoTien] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [ngayGiaoDich, setNgayGiaoDich] = useState(() => new Date());
  const [dangChonNgay, setDangChonNgay] = useState(false);

  const xuLyChonNgay = (event: DateTimePickerEvent, ngay?: Date) => {
    if (ngay) setNgayGiaoDich(ngay);
    if (event.type === 'dismissed' || Platform.OS !== 'ios') setDangChonNgay(false);
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (danhSachGiaoDich && maGiaoDich) {
      const gd = danhSachGiaoDich.find(g => g.maGiaoDich === maGiaoDich);
      if (gd) {
        setLoai(gd.loai);
        setMaVi(gd.maVi);
        setMaViDoi(gd.maViDoi || null);
        setMaDanhMuc(gd.maDanhMuc || null);
        setSoTien(String(gd.soTien));
        setGhiChu(gd.ghiChu || '');
        setNgayGiaoDich(new Date(gd.ngayGiaoDich));
      }
    }
  }, [danhSachGiaoDich, maGiaoDich]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const xuLyLuu = () => {
    const homNay = new Date();
    homNay.setHours(0, 0, 0, 0);
    const ngayDaChon = new Date(ngayGiaoDich);
    ngayDaChon.setHours(0, 0, 0, 0);
    if (ngayDaChon > homNay) {
      Alert.alert('Ngày không hợp lệ', 'Không thể chọn ngày trong tương lai');
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

    capNhatGiaoDich.mutate(
      {
        maGiaoDich,
        maVi,
        maViDoi: loai === 'ChuyenKhoan' ? maViDoi : null,
        maDanhMuc: loai === 'ChuyenKhoan' ? null : maDanhMuc,
        loai,
        soTien: soTienSo,
        ghiChu: ghiChu.trim() || null,
        ngayGiaoDich: ngayThanhChuoiIso(ngayGiaoDich),
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Lỗi', 'Không cập nhật được giao dịch, thử lại sau'),
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sửa giao dịch</Text>
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
          {loai === 'ChuyenKhoan' ? 'Từ ví' : 'Ví'}
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
            <Text style={[styles.label, { color: colors.textSecondary }]}>Đến ví</Text>
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
            onChange={xuLyChonNgay}
          />
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>Ghi chú (không bắt buộc)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="VD: Ăn trưa với bạn..."
          placeholderTextColor={colors.textMuted}
          value={ghiChu}
          onChangeText={setGhiChu}
        />

        <TouchableOpacity
          style={[styles.nutLuu, { backgroundColor: colors.primary }]}
          onPress={xuLyLuu}
          disabled={capNhatGiaoDich.isPending}
        >
          <Text style={styles.nutLuuChu}>
            {capNhatGiaoDich.isPending ? 'Đang lưu...' : 'Cập nhật giao dịch'}
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
  nutLuu: {
    borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40,
  },
  nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
