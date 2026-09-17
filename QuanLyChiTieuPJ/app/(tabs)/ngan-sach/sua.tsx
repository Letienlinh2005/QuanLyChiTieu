import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useNganSach, useCapNhatNganSach } from '../../../src/hooks/useNganSach';

const NGUONG_KHA_DUNG = [50, 70, 80, 90, 100];

export default function SuaNganSachScreen() {
  const params = useLocalSearchParams<{ id?: string, thang?: string; nam?: string }>();
  const maNganSach = Number(params.id);
  const thangApDung = Number(params.thang) || new Date().getMonth() + 1;
  const namApDung = Number(params.nam) || new Date().getFullYear();

  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { data: nganSachHienTai } = useNganSach(maSoChiTieu, thangApDung, namApDung);
  const capNhatNganSach = useCapNhatNganSach(maSoChiTieu);

  const [soTien, setSoTien] = useState('');
  const [nguongCanhBao, setNguongCanhBao] = useState(80);
  const [tenDanhMuc, setTenDanhMuc] = useState('');

  useEffect(() => {
    if (nganSachHienTai && maNganSach) {
      const ns = nganSachHienTai.find(n => n.maNganSach === maNganSach);
      if (ns) {
        setSoTien(String(ns.soTien));
        setNguongCanhBao(ns.nguongCanhBao);
        setTenDanhMuc(`${ns.bieuTuong || ''} ${ns.tenDanhMuc || ''}`);
      }
    }
  }, [nganSachHienTai, maNganSach]);

  const xuLyLuu = () => {
    const soTienSo = Number(soTien.replace(/\D/g, ''));
    if (!soTienSo || soTienSo <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    capNhatNganSach.mutate(
      {
        maNganSach,
        soTien: soTienSo,
        nguongCanhBao,
      },
      {
        onSuccess: () => router.back(),
        onError: (err: any) => {
          const thongBao = err?.response?.data?.message ?? 'Không cập nhật được ngân sách, thử lại sau';
          Alert.alert('Lỗi', thongBao);
        },
      }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.tieuDePhu}>Sửa ngân sách tháng {thangApDung}/{namApDung}</Text>

      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.chonRow}>
        <View style={[styles.chip, styles.chipChon]}>
          <Text style={[styles.chipLabel, styles.chipLabelChon]}>{tenDanhMuc}</Text>
        </View>
      </View>

      <Text style={styles.label}>Hạn mức mới</Text>
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
        disabled={capNhatNganSach.isPending}
      >
        <Text style={styles.nutLuuChu}>
          {capNhatNganSach.isPending ? 'Đang lưu...' : 'Lưu ngân sách'}
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
