import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useNganSach, useCapNhatNganSach } from '../../../src/hooks/useNganSach';
import { useAppTheme } from '../../../src/store/themeStore';

const NGUONG_KHA_DUNG = [50, 70, 80, 90, 100];

export default function SuaNganSachScreen() {
  const params = useLocalSearchParams<{ id?: string, thang?: string; nam?: string }>();
  const maNganSach = Number(params.id);
  const thangApDung = Number(params.thang) || new Date().getMonth() + 1;
  const namApDung = Number(params.nam) || new Date().getFullYear();

  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { data: nganSachHienTai } = useNganSach(maSoChiTieu, thangApDung, namApDung);
  const capNhatNganSach = useCapNhatNganSach(maSoChiTieu);
  const { isDark, colors } = useAppTheme();

  const [soTien, setSoTien] = useState('');
  const [nguongCanhBao, setNguongCanhBao] = useState(80);
  const [tenDanhMuc, setTenDanhMuc] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect */
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
  /* eslint-enable react-hooks/set-state-in-effect */

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sửa ngân sách</Text>
        <View style={styles.nutBack} />
      </View>

      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.tieuDePhu, { color: colors.textMuted }]}>
          Sửa ngân sách tháng {thangApDung}/{namApDung}
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Danh mục</Text>
        <View style={styles.chonRow}>
          <View style={[styles.chip, chipSelectedStyle]}>
            <Text style={[styles.chipLabel, chipSelectedTextStyle]}>{tenDanhMuc}</Text>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Hạn mức mới (đ)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          value={soTien}
          onChangeText={setSoTien}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Ngưỡng cảnh báo</Text>
        <View style={styles.chonRow}>
          {NGUONG_KHA_DUNG.map((n) => {
            const isSelected = nguongCanhBao === n;
            return (
              <TouchableOpacity
                key={n}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && chipSelectedStyle,
                ]}
                onPress={() => setNguongCanhBao(n)}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: colors.text },
                    isSelected && chipSelectedTextStyle,
                  ]}
                >
                  {n}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.nutLuu, { backgroundColor: colors.primary }]}
          onPress={xuLyLuu}
          disabled={capNhatNganSach.isPending}
        >
          <Text style={styles.nutLuuChu}>
            {capNhatNganSach.isPending ? 'Đang lưu...' : 'Lưu ngân sách'}
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
  tieuDePhu: { fontSize: 13, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16,
  },
  chonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1,
  },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 13 },
  goiY: { fontStyle: 'italic', fontSize: 13 },
  nutLuu: {
    borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40,
  },
  nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
