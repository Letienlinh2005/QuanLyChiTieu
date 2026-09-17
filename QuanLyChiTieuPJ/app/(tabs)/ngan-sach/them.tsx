import { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useDanhMuc } from '../../../src/hooks/useDanhMuc';
import { useNganSach, useTaoNganSach } from '../../../src/hooks/useNganSach';

const NGUONG_KHA_DUNG = [50, 70, 80, 90, 100];

export default function ThemNganSachScreen() {
  const params = useLocalSearchParams<{ thang?: string; nam?: string }>();
  const homNay = new Date();
  const thangApDung = Number(params.thang) || homNay.getMonth() + 1;
  const namApDung = Number(params.nam) || homNay.getFullYear();

  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { data: danhSachDanhMucChi } = useDanhMuc(maSoChiTieu, 'Chi');
  const { data: nganSachHienTai } = useNganSach(maSoChiTieu, thangApDung, namApDung);
  const taoNganSach = useTaoNganSach();

  const [maDanhMuc, setMaDanhMuc] = useState<number | null>(null);
  const [soTien, setSoTien] = useState('');
  const [nguongCanhBao, setNguongCanhBao] = useState(80);

  const danhMucChuaCoNganSach = useMemo(() => {
    const daCoNganSach = new Set((nganSachHienTai ?? []).map((n) => n.maDanhMuc));
    return (danhSachDanhMucChi ?? []).filter((dm) => !daCoNganSach.has(dm.maDanhMuc));
  }, [danhSachDanhMucChi, nganSachHienTai]);

  const xuLyLuu = () => {
    if (!maSoChiTieu) {
      Alert.alert('Lỗi', 'Chưa xác định được sổ chi tiêu');
      return;
    }
    if (!maDanhMuc) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn danh mục');
      return;
    }
    const soTienSo = Number(soTien.replace(/\D/g, ''));
    if (!soTienSo || soTienSo <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    taoNganSach.mutate(
      {
        maSoChiTieu,
        maDanhMuc,
        soTien: soTienSo,
        thangApDung,
        namApDung,
        nguongCanhBao,
      },
      {
        onSuccess: () => router.back(),
        onError: (err: any) => {
          const thongBao = err?.response?.data?.message ?? 'Không tạo được ngân sách, thử lại sau';
          Alert.alert('Lỗi', thongBao);
        },
      }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.tieuDePhu}>Ngân sách cho tháng {thangApDung}/{namApDung}</Text>

      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.chonRow}>
        {danhMucChuaCoNganSach.map((dm) => (
          <TouchableOpacity
            key={dm.maDanhMuc}
            style={[styles.chip, maDanhMuc === dm.maDanhMuc && styles.chipChon]}
            onPress={() => setMaDanhMuc(dm.maDanhMuc)}
          >
            <Text style={styles.chipIcon}>{dm.bieuTuong}</Text>
            <Text style={[styles.chipLabel, maDanhMuc === dm.maDanhMuc && styles.chipLabelChon]}>
              {dm.tenDanhMuc}
            </Text>
          </TouchableOpacity>
        ))}
        {danhMucChuaCoNganSach.length === 0 && (
          <Text style={styles.goiY}>
            Tất cả danh mục chi đã có ngân sách cho tháng này.
          </Text>
        )}
      </View>

      <Text style={styles.label}>Hạn mức</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        value={soTien}
        onChangeText={setSoTien}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Ngưỡng cảnh báo</Text>
      <View style={styles.chonRow}>
        {NGUONG_KHA_DUNG.map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.chip, nguongCanhBao === n && styles.chipChon]}
            onPress={() => setNguongCanhBao(n)}
          >
            <Text style={[styles.chipLabel, nguongCanhBao === n && styles.chipLabelChon]}>{n}%</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.nutLuu}
        onPress={xuLyLuu}
        disabled={taoNganSach.isPending}
      >
        <Text style={styles.nutLuuChu}>
          {taoNganSach.isPending ? 'Đang lưu...' : 'Lưu ngân sách'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  tieuDePhu: { fontSize: 13, color: '#9ca3af', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16, color: '#374151' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16,
  },
  chonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipChon: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 13, color: '#374151' },
  chipLabelChon: { color: '#2563eb', fontWeight: '600' },
  goiY: { color: '#9ca3af', fontStyle: 'italic', fontSize: 13 },
  nutLuu: {
    backgroundColor: '#2563eb', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40,
  },
  nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
