import { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../../src/store/appStore';
import { useVi } from '../../../src/hooks/useVi';
import { useDanhMuc } from '../../../src/hooks/useDanhMuc';
import { useTaoGiaoDich } from '../../../src/hooks/useGiaoDich';
import { LoaiGiaoDich } from '../../../src/types/giaoDich';

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
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { data: danhSachVi } = useVi(maSoChiTieu);
  const taoGiaoDich = useTaoGiaoDich();

  const [loai, setLoai] = useState<LoaiGiaoDich>('Chi');
  const [maVi, setMaVi] = useState<number | null>(null);
  const [maViDoi, setMaViDoi] = useState<number | null>(null);
  const [maDanhMuc, setMaDanhMuc] = useState<number | null>(null);
  const [soTien, setSoTien] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [ngayGiaoDich, setNgayGiaoDich] = useState(() => new Date());

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
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Lỗi', 'Không tạo được giao dịch, thử lại sau'),
      }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Loại giao dịch</Text>
      <View style={styles.chonRow}>
        {CAC_LOAI_GIAO_DICH.map((l) => (
          <TouchableOpacity
            key={l.value}
            style={[styles.chip, loai === l.value && styles.chipChon]}
            onPress={() => xuLyDoiLoai(l.value)}
          >
            <Text style={[styles.chipLabel, loai === l.value && styles.chipLabelChon]}>
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{loai === 'ChuyenKhoan' ? 'Từ ví' : 'Ví'}</Text>
      <View style={styles.chonRow}>
        {(danhSachVi ?? []).map((v) => (
          <TouchableOpacity
            key={v.maVi}
            style={[styles.chip, maVi === v.maVi && styles.chipChon]}
            onPress={() => {
              setMaVi(v.maVi);
              if (maViDoi === v.maVi) setMaViDoi(null);
            }}
          >
            <Text style={styles.chipIcon}>{v.bieuTuong}</Text>
            <Text style={[styles.chipLabel, maVi === v.maVi && styles.chipLabelChon]}>
              {v.tenVi}
            </Text>
          </TouchableOpacity>
        ))}
        {(danhSachVi ?? []).length === 0 && (
          <Text style={styles.goiY}>Chưa có ví nào, vào tab Ví để thêm.</Text>
        )}
      </View>

      {loai === 'ChuyenKhoan' && (
        <>
          <Text style={styles.label}>Đến ví</Text>
          <View style={styles.chonRow}>
            {viDoiKhaDung.map((v) => (
              <TouchableOpacity
                key={v.maVi}
                style={[styles.chip, maViDoi === v.maVi && styles.chipChon]}
                onPress={() => setMaViDoi(v.maVi)}
              >
                <Text style={styles.chipIcon}>{v.bieuTuong}</Text>
                <Text style={[styles.chipLabel, maViDoi === v.maVi && styles.chipLabelChon]}>
                  {v.tenVi}
                </Text>
              </TouchableOpacity>
            ))}
            {viDoiKhaDung.length === 0 && (
              <Text style={styles.goiY}>Cần ít nhất 2 ví để chuyển khoản.</Text>
            )}
          </View>
        </>
      )}

      {loai !== 'ChuyenKhoan' && (
        <>
          <Text style={styles.label}>Danh mục</Text>
          <View style={styles.chonRow}>
            {(danhSachDanhMuc ?? []).map((dm) => (
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
            {(danhSachDanhMuc ?? []).length === 0 && (
              <Text style={styles.goiY}>Chưa có danh mục phù hợp.</Text>
            )}
          </View>
        </>
      )}

      <Text style={styles.label}>Số tiền</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        value={soTien}
        onChangeText={setSoTien}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Ngày giao dịch</Text>
      <View style={styles.chonRow}>
        <TouchableOpacity
          style={[styles.chip, styles.chipChon]}
          onPress={() => setNgayGiaoDich(new Date())}
        >
          <Text style={[styles.chipLabel, styles.chipLabelChon]}>Hôm nay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => {
            const homQua = new Date();
            homQua.setDate(homQua.getDate() - 1);
            setNgayGiaoDich(homQua);
          }}
        >
          <Text style={styles.chipLabel}>Hôm qua</Text>
        </TouchableOpacity>
        <View style={styles.ngayInputRow}>
          <TextInput
            style={styles.ngayInputO}
            value={String(ngayGiaoDich.getDate())}
            keyboardType="numeric"
            maxLength={2}
            onChangeText={(t) => {
              const ngay = Number(t) || 1;
              const d = new Date(ngayGiaoDich);
              d.setDate(ngay);
              setNgayGiaoDich(d);
            }}
          />
          <Text style={styles.ngayGachChu}>/</Text>
          <TextInput
            style={styles.ngayInputO}
            value={String(ngayGiaoDich.getMonth() + 1)}
            keyboardType="numeric"
            maxLength={2}
            onChangeText={(t) => {
              const thang = Number(t) || 1;
              const d = new Date(ngayGiaoDich);
              d.setMonth(thang - 1);
              setNgayGiaoDich(d);
            }}
          />
          <Text style={styles.ngayGachChu}>/</Text>
          <TextInput
            style={styles.ngayInputONam}
            value={String(ngayGiaoDich.getFullYear())}
            keyboardType="numeric"
            maxLength={4}
            onChangeText={(t) => {
              const nam = Number(t) || ngayGiaoDich.getFullYear();
              const d = new Date(ngayGiaoDich);
              d.setFullYear(nam);
              setNgayGiaoDich(d);
            }}
          />
        </View>
      </View>

      <Text style={styles.label}>Ghi chú (không bắt buộc)</Text>
      <TextInput
        style={styles.input}
        placeholder="VD: Ăn trưa với bạn..."
        value={ghiChu}
        onChangeText={setGhiChu}
      />

      <TouchableOpacity
        style={styles.nutLuu}
        onPress={xuLyLuu}
        disabled={taoGiaoDich.isPending}
      >
        <Text style={styles.nutLuuChu}>
          {taoGiaoDich.isPending ? 'Đang lưu...' : 'Lưu giao dịch'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16, color: '#374151' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16,
  },
  chonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipChon: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 13, color: '#374151' },
  chipLabelChon: { color: '#2563eb', fontWeight: '600' },
  goiY: { color: '#9ca3af', fontStyle: 'italic', fontSize: 13 },
  ngayInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 },
  ngayInputO: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, fontSize: 14,
    width: 40, textAlign: 'center',
  },
  ngayInputONam: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, fontSize: 14,
    width: 56, textAlign: 'center',
  },
  ngayGachChu: { color: '#9ca3af' },
  nutLuu: {
    backgroundColor: '#2563eb', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40,
  },
  nutLuuChu: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
