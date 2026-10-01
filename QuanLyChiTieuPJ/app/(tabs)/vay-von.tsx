import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, FlatList, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppStore } from '../../src/store/appStore';
import { useAppTheme } from '../../src/store/themeStore';
import {
  useDanhSachVay, useThemVay, useXoaVay, useCapNhatVay,
  useDanhSachChoVay, useThemChoVay, useXoaChoVay, useCapNhatChoVay,
} from '../../src/hooks/useVayVon';
import { KhoanVay, TaoKhoanVayDto, tinhLaiSuat } from '../../src/types/vayVon';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { useNhacTraLai } from '../../src/hooks/useNhacTraLai';

// Thêm dấu chấm phân cách nghìn khi nhập số tiền
function formatSoTien(raw: string): string {
  const soThuan = raw.replace(/\./g, '').replace(/[^0-9]/g, '');
  return soThuan.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function parseSoTien(formatted: string): number {
  return parseFloat(formatted.replace(/\./g, '')) || 0;
}

// ======= Form nhập khoản vay / cho vay =======
interface FormVay {
  tenKhoanVay: string;
  soTienGoc: string;
  laiSuatNam: string;
  kyHanThang: string;
  ngayVay: string;
  ghiChu: string;
  ngayTraLaiHangThang: string; // ngày trong tháng (1-31), rỗng = không đặt
}

const FORM_RONG: FormVay = { tenKhoanVay: '', soTienGoc: '', laiSuatNam: '', kyHanThang: '', ngayVay: '', ghiChu: '', ngayTraLaiHangThang: '' };

function formatNgay(ngay: string) {
  if (!ngay) return '—';
  try {
    return new Date(ngay).toLocaleDateString('vi-VN');
  } catch { return ngay; }
}

function ngayKetThuc(ngayVay: string, kyHanThang: number) {
  const d = new Date(ngayVay);
  d.setMonth(d.getMonth() + kyHanThang);
  return d.toLocaleDateString('vi-VN');
}

// ======= Card mỗi khoản vay =======
function KhoanVayCard({
  item, loai, colors, isDark, maSoChiTieu,
}: { item: KhoanVay; loai: 'vay' | 'cho-vay'; colors: any; isDark: boolean; maSoChiTieu: number }) {
  const [moRong, setMoRong] = useState(false);
  const xoaVay = useXoaVay(maSoChiTieu);
  const xoaChoVay = useXoaChoVay(maSoChiTieu);
  const capNhatVay = useCapNhatVay(maSoChiTieu);
  const capNhatChoVay = useCapNhatChoVay(maSoChiTieu);

  const kq = tinhLaiSuat(item.soTienGoc, item.laiSuatNam, item.kyHanThang);

  const xacNhanXoa = () => {
    Alert.alert('Xoá khoản ' + (loai === 'vay' ? 'vay' : 'cho vay'), 'Bạn chắc chắn muốn xoá?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive',
        onPress: () => {
          if (loai === 'vay') xoaVay.mutate(item.maVay);
          else xoaChoVay.mutate(item.maVay);
        },
      },
    ]);
  };

  const doiTrangThai = () => {
    const trangThaiMoi = item.trangThai === 'DangVay' ? 'DaTatToan' : 'DangVay';
    const body = {
      id: item.maVay,
      tenKhoanVay: item.tenKhoanVay,
      soTienGoc: item.soTienGoc,
      laiSuatNam: item.laiSuatNam,
      kyHanThang: item.kyHanThang,
      ngayVay: item.ngayVay,
      ghiChu: item.ghiChu,
      trangThai: trangThaiMoi,
    };
    if (loai === 'vay') capNhatVay.mutate(body);
    else capNhatChoVay.mutate(body);
  };

  const mauTrangThai = item.trangThai === 'DaTatToan' ? '#10b981' : '#f59e0b';

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity onPress={() => setMoRong(!moRong)} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.cardTen, { color: colors.text }]}>{item.tenKhoanVay}</Text>
            <View style={[styles.trangThaiTag, { backgroundColor: item.trangThai === 'DaTatToan' ? '#d1fae5' : '#fef3c7' }]}>
              <Text style={{ color: mauTrangThai, fontSize: 11, fontWeight: '700' }}>
                {item.trangThai === 'DaTatToan' ? '✓ Tất toán' : '⏳ Đang vay'}
              </Text>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={[styles.cardSoTien, { color: loai === 'vay' ? '#ef4444' : '#10b981' }]}>
              {formatCurrency(item.soTienGoc)}
            </Text>
            <Ionicons name={moRong ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={[styles.cardInfoText, { color: colors.textMuted }]}>
            🏦 Lãi suất: <Text style={{ color: colors.text, fontWeight: '600' }}>{item.laiSuatNam}%/năm</Text>
            {'  '}📅 {item.kyHanThang} tháng
          </Text>
          <Text style={[styles.cardInfoText, { color: colors.textMuted }]}>
            Ngày vay: {formatNgay(item.ngayVay)} → {ngayKetThuc(item.ngayVay, item.kyHanThang)}
          </Text>
          {item.ngayTraLaiHangThang ? (
            <Text style={[styles.cardInfoText, { color: '#f59e0b' }]}>
              ⏰ Hạn trả lãi: mỗi tháng ngày <Text style={{ fontWeight: '700' }}>{item.ngayTraLaiHangThang}</Text>
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {moRong && (
        <View style={[styles.chiTiet, { borderTopColor: colors.border }]}>
          {/* Tính lãi */}
          <Text style={[styles.chiTietTieuDe, { color: colors.text }]}>📊 Chi tiết lãi suất</Text>

          <View style={[styles.chiTietBang, { backgroundColor: isDark ? '#1e1e2e' : '#f8fafc' }]}>
            <View style={styles.chiTietRow}>
              <Text style={[styles.chiTietNhan, { color: colors.textMuted }]}>Lãi suất/tháng</Text>
              <Text style={[styles.chiTietGiaTri, { color: colors.text }]}>{kq.laiSuatThang.toFixed(4)}%</Text>
            </View>
            <View style={[styles.chiTietRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.chiTietNhan, { color: colors.textMuted }]}>Tổng lãi (lãi đơn)</Text>
              <Text style={[styles.chiTietGiaTri, { color: '#f59e0b' }]}>{formatCurrency(kq.tongLai)}</Text>
            </View>
            <View style={[styles.chiTietRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.chiTietNhan, { color: colors.textMuted }]}>Trả mỗi tháng (lãi đơn)</Text>
              <Text style={[styles.chiTietGiaTri, { color: colors.primary }]}>{formatCurrency(kq.traMoiThang)}</Text>
            </View>
            <View style={[styles.chiTietRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.chiTietNhan, { color: colors.textMuted }]}>Tổng phải trả (lãi đơn)</Text>
              <Text style={[styles.chiTietGiaTri, { color: '#ef4444', fontWeight: '800' }]}>{formatCurrency(kq.tongPhaiTra)}</Text>
            </View>
          </View>

          <Text style={[styles.chiTietTieuDe, { color: colors.text, marginTop: 8 }]}>📉 Dư nợ giảm dần (Annuity)</Text>
          <View style={[styles.chiTietBang, { backgroundColor: isDark ? '#1e1e2e' : '#f8fafc' }]}>
            <View style={styles.chiTietRow}>
              <Text style={[styles.chiTietNhan, { color: colors.textMuted }]}>Trả mỗi tháng</Text>
              <Text style={[styles.chiTietGiaTri, { color: colors.primary }]}>{formatCurrency(kq.traMoiThangAnuity)}</Text>
            </View>
            <View style={[styles.chiTietRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.chiTietNhan, { color: colors.textMuted }]}>Tổng lãi</Text>
              <Text style={[styles.chiTietGiaTri, { color: '#f59e0b' }]}>{formatCurrency(kq.tongLaiAnuity)}</Text>
            </View>
            <View style={[styles.chiTietRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.chiTietNhan, { color: colors.textMuted }]}>Tổng phải trả</Text>
              <Text style={[styles.chiTietGiaTri, { color: '#ef4444', fontWeight: '800' }]}>{formatCurrency(kq.tongPhaiTraAnuity)}</Text>
            </View>
          </View>

          {item.ghiChu ? (
            <Text style={[styles.ghiChu, { color: colors.textMuted, borderColor: colors.border }]}>📝 {item.ghiChu}</Text>
          ) : null}

          {/* Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actBtn, { backgroundColor: item.trangThai === 'DaTatToan' ? '#fef3c7' : '#d1fae5' }]}
              onPress={doiTrangThai}
            >
              <Text style={{ color: item.trangThai === 'DaTatToan' ? '#92400e' : '#065f46', fontWeight: '600', fontSize: 12 }}>
                {item.trangThai === 'DaTatToan' ? '↩ Hoàn tác' : '✓ Tất toán'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actBtn, { backgroundColor: '#fee2e2' }]} onPress={xacNhanXoa}>
              <Ionicons name="trash-outline" size={14} color="#dc2626" />
              <Text style={{ color: '#dc2626', fontWeight: '600', fontSize: 12, marginLeft: 4 }}>Xoá</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ======= Modal thêm khoản vay =======
function ModalThemVay({
  hienThi, onDong, loai, maSoChiTieu, colors, isDark,
}: {
  hienThi: boolean; onDong: () => void; loai: 'vay' | 'cho-vay';
  maSoChiTieu: number; colors: any; isDark: boolean;
}) {
  const [form, setForm] = useState<FormVay>(FORM_RONG);
  const [hienDatePicker, setHienDatePicker] = useState(false);
  const [ngayChon, setNgayChon] = useState(new Date());
  const themVay = useThemVay();
  const themChoVay = useThemChoVay();

  const nhapTruong = (key: keyof FormVay) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const onChonNgay = (_: any, date?: Date) => {
    setHienDatePicker(Platform.OS === 'ios'); // iOS giữ picker mở
    if (date) {
      setNgayChon(date);
      setForm(f => ({ ...f, ngayVay: date.toISOString().slice(0, 10) }));
    }
  };

  const xemTruocLai = () => {
    const goc = parseSoTien(form.soTienGoc);
    const lai = parseFloat(form.laiSuatNam);
    const kyHan = parseInt(form.kyHanThang);
    if (!goc || !lai || !kyHan) return null;
    return tinhLaiSuat(goc, lai, kyHan);
  };
  const xemTruoc = xemTruocLai();

  const luuKhoan = () => {
    const soTienGoc = parseSoTien(form.soTienGoc);
    const laiSuatNam = parseFloat(form.laiSuatNam);
    const kyHanThang = parseInt(form.kyHanThang);

    if (!form.tenKhoanVay || !soTienGoc || !laiSuatNam || !kyHanThang || !form.ngayVay) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    const dto: TaoKhoanVayDto = {
      maSoChiTieu, tenKhoanVay: form.tenKhoanVay,
      soTienGoc, laiSuatNam, kyHanThang,
      ngayVay: form.ngayVay, ghiChu: form.ghiChu,
      ngayTraLaiHangThang: form.ngayTraLaiHangThang ? parseInt(form.ngayTraLaiHangThang) : null,
    };

    const mutate = loai === 'vay' ? themVay.mutate : themChoVay.mutate;
    mutate(dto, {
      onSuccess: () => { setForm(FORM_RONG); setNgayChon(new Date()); onDong(); },
      onError: () => Alert.alert('Lỗi', 'Không thể lưu khoản vay.'),
    });
  };

  return (
    <Modal visible={hienThi} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
          <View style={styles.modalTieuDe}>
            <Text style={[styles.modalTieuDeText, { color: colors.text }]}>
              {loai === 'vay' ? '🏦 Thêm khoản vay ngân hàng' : '💸 Thêm khoản cho vay'}
            </Text>
            <TouchableOpacity onPress={onDong}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Tên khoản vay */}
            <View style={styles.formTruong}>
              <Text style={[styles.formNhan, { color: colors.textMuted }]}>
                {loai === 'vay' ? 'Tên ngân hàng / khoản vay *' : 'Tên người vay *'}
              </Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, backgroundColor: isDark ? '#1e1e2e' : '#f8fafc', borderColor: colors.border }]}
                placeholder={loai === 'vay' ? 'VD: Vay BIDV mua nhà' : 'VD: Nguyễn Văn A'}
                placeholderTextColor={colors.textMuted}
                value={form.tenKhoanVay}
                onChangeText={nhapTruong('tenKhoanVay')}
              />
            </View>

            {/* Số tiền gốc — có dấu chấm phân cách */}
            <View style={styles.formTruong}>
              <Text style={[styles.formNhan, { color: colors.textMuted }]}>Số tiền gốc (đ) *</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, backgroundColor: isDark ? '#1e1e2e' : '#f8fafc', borderColor: colors.border }]}
                placeholder="VD: 100.000.000"
                placeholderTextColor={colors.textMuted}
                value={form.soTienGoc}
                onChangeText={(val) => setForm(f => ({ ...f, soTienGoc: formatSoTien(val) }))}
                keyboardType="numeric"
              />
            </View>

            {/* Lãi suất */}
            <View style={styles.formTruong}>
              <Text style={[styles.formNhan, { color: colors.textMuted }]}>Lãi suất (%/năm) *</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, backgroundColor: isDark ? '#1e1e2e' : '#f8fafc', borderColor: colors.border }]}
                placeholder="VD: 8.5"
                placeholderTextColor={colors.textMuted}
                value={form.laiSuatNam}
                onChangeText={nhapTruong('laiSuatNam')}
                keyboardType="numeric"
              />
            </View>

            {/* Kỳ hạn */}
            <View style={styles.formTruong}>
              <Text style={[styles.formNhan, { color: colors.textMuted }]}>Kỳ hạn (tháng) *</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, backgroundColor: isDark ? '#1e1e2e' : '#f8fafc', borderColor: colors.border }]}
                placeholder="VD: 60"
                placeholderTextColor={colors.textMuted}
                value={form.kyHanThang}
                onChangeText={nhapTruong('kyHanThang')}
                keyboardType="numeric"
              />
            </View>

            {/* Ngày vay — DateTimePicker */}
            <View style={styles.formTruong}>
              <Text style={[styles.formNhan, { color: colors.textMuted }]}>Ngày vay *</Text>
              <TouchableOpacity
                style={[styles.formInput, styles.datePickerBtn, { backgroundColor: isDark ? '#1e1e2e' : '#f8fafc', borderColor: colors.border }]}
                onPress={() => setHienDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: form.ngayVay ? colors.text : colors.textMuted, fontSize: 14 }}>
                  {form.ngayVay
                    ? new Date(form.ngayVay).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Chọn ngày vay...'}
                </Text>
              </TouchableOpacity>
              {hienDatePicker && (
                <DateTimePicker
                  value={ngayChon}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChonNgay}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Ghi chú */}
            <View style={styles.formTruong}>
              <Text style={[styles.formNhan, { color: colors.textMuted }]}>Ghi chú</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, backgroundColor: isDark ? '#1e1e2e' : '#f8fafc', borderColor: colors.border }]}
                placeholder="Tuỳ chọn..."
                placeholderTextColor={colors.textMuted}
                value={form.ghiChu}
                onChangeText={nhapTruong('ghiChu')}
              />
            </View>

            {/* Ngày trả lãi hàng tháng */}
            <View style={styles.formTruong}>
              <Text style={[styles.formNhan, { color: colors.textMuted }]}>⏰ Ngày đến hạn trả lãi hàng tháng</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, backgroundColor: isDark ? '#1e1e2e' : '#f8fafc', borderColor: colors.border }]}
                placeholder="VD: 15 (ngày 15 mỗi tháng) — để trống nếu không cần"
                placeholderTextColor={colors.textMuted}
                value={form.ngayTraLaiHangThang}
                onChangeText={(val) => {
                  const so = parseInt(val.replace(/[^0-9]/g, ''));
                  if (!val) setForm(f => ({ ...f, ngayTraLaiHangThang: '' }));
                  else if (so >= 1 && so <= 31) setForm(f => ({ ...f, ngayTraLaiHangThang: String(so) }));
                }}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            {/* Xem trước lãi */}
            {xemTruoc && (
              <View style={[styles.xemTruocBox, { backgroundColor: isDark ? '#0f172a' : '#f0f9ff', borderColor: colors.primary }]}>
                <Text style={[styles.xemTruocTieuDe, { color: colors.primary }]}>📊 Xem trước tính lãi</Text>
                <Text style={[styles.xemTruocDong, { color: colors.text }]}>
                  Lãi đơn: <Text style={{ fontWeight: '700', color: '#f59e0b' }}>{formatCurrency(xemTruoc.tongLai)}</Text>
                </Text>
                <Text style={[styles.xemTruocDong, { color: colors.text }]}>
                  Trả mỗi tháng (lãi đơn): <Text style={{ fontWeight: '700', color: colors.primary }}>{formatCurrency(xemTruoc.traMoiThang)}</Text>
                </Text>
                <Text style={[styles.xemTruocDong, { color: colors.text }]}>
                  Tổng phải trả: <Text style={{ fontWeight: '800', color: '#ef4444' }}>{formatCurrency(xemTruoc.tongPhaiTra)}</Text>
                </Text>
                <View style={[styles.xemTruocDivider, { backgroundColor: colors.border }]} />
                <Text style={[styles.xemTruocDong, { color: colors.text }]}>
                  Dư nợ giảm dần - trả/tháng: <Text style={{ fontWeight: '700', color: colors.primary }}>{formatCurrency(xemTruoc.traMoiThangAnuity)}</Text>
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.nutLuu, { backgroundColor: colors.primary }]}
              onPress={luuKhoan}
              disabled={themVay.isPending || themChoVay.isPending}
            >
              {(themVay.isPending || themChoVay.isPending)
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.nutLuuText}>Lưu khoản {loai === 'vay' ? 'vay' : 'cho vay'}</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ======= Tab Vay ngân hàng / Cho vay =======
function DanhSachTab({
  loai, maSoChiTieu, colors, isDark,
}: { loai: 'vay' | 'cho-vay'; maSoChiTieu: number; colors: any; isDark: boolean }) {
  const { data: dsVay, isLoading: lVay, refetch: rVay } = useDanhSachVay(maSoChiTieu);
  const { data: dsCho, isLoading: lCho, refetch: rCho } = useDanhSachChoVay(maSoChiTieu);
  const [moModal, setMoModal] = useState(false);

  useFocusEffect(useCallback(() => {
    if (loai === 'vay') rVay(); else rCho();
  }, [loai, maSoChiTieu]));

  const danhSach = loai === 'vay' ? (dsVay ?? []) : (dsCho ?? []);
  const dangTai = loai === 'vay' ? lVay : lCho;

  const tongGoc = danhSach.reduce((s, k) => k.trangThai === 'DangVay' ? s + k.soTienGoc : s, 0);
  const tongLaiThang = danhSach
    .filter(k => k.trangThai === 'DangVay')
    .reduce((s, k) => s + tinhLaiSuat(k.soTienGoc, k.laiSuatNam, k.kyHanThang).traMoiThang, 0);

  return (
    <View style={{ flex: 1 }}>
      {/* Tổng kết */}
      {danhSach.length > 0 && (
        <View style={styles.tongKetRow}>
          <View style={[styles.tongKetO, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.tongKetNhan, { color: colors.textMuted }]}>Tổng gốc đang {loai === 'vay' ? 'vay' : 'cho vay'}</Text>
            <Text style={[styles.tongKetGiaTri, { color: loai === 'vay' ? '#ef4444' : '#10b981' }]}>
              {formatCurrency(tongGoc)}
            </Text>
          </View>
          <View style={[styles.tongKetO, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.tongKetNhan, { color: colors.textMuted }]}>Lãi đơn/tháng</Text>
            <Text style={[styles.tongKetGiaTri, { color: '#f59e0b' }]}>{formatCurrency(tongLaiThang)}</Text>
          </View>
        </View>
      )}

      {/* Ghi chú: không ảnh hưởng ví */}
      <View style={[styles.infoBanner, { backgroundColor: isDark ? '#1e293b' : '#f0f9ff', borderColor: isDark ? '#334155' : '#bae6fd' }]}>
        <Ionicons name="information-circle-outline" size={14} color={isDark ? '#7dd3fc' : '#0284c7'} />
        <Text style={[styles.infoBannerText, { color: isDark ? '#7dd3fc' : '#0369a1' }]}>
          Module này chỉ theo dõi lãi suất và dư nợ — không tự động cộng/trừ số dư ví.
        </Text>
      </View>

      {dangTai ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : danhSach.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name={loai === 'vay' ? 'business-outline' : 'people-outline'} size={54} color={colors.textMuted} />
          <Text style={[styles.rongText, { color: colors.textMuted }]}>
            Chưa có khoản {loai === 'vay' ? 'vay ngân hàng' : 'cho vay'} nào.
          </Text>
          <Text style={[styles.rongText, { color: colors.textMuted, fontSize: 12, marginTop: 4 }]}>
            💡 Chức năng này giúp theo dõi lãi suất, dư nợ — không ảnh hưởng số dư ví.
          </Text>
        </View>
      ) : (
        <FlatList
          data={danhSach}
          keyExtractor={(k) => String(k.maVay)}
          renderItem={({ item }) => (
            <KhoanVayCard item={item} loai={loai} colors={colors} isDark={isDark} maSoChiTieu={maSoChiTieu} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      {/* FAB Thêm */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setMoModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <ModalThemVay
        hienThi={moModal}
        onDong={() => setMoModal(false)}
        loai={loai}
        maSoChiTieu={maSoChiTieu}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}

// ======= Màn hình chính =======
export default function VayVonScreen() {
  const maSoChiTieu = useAppStore((s) => s.maSoChiTieu);
  const { isDark, colors } = useAppTheme();
  const [tab, setTab] = useState<'vay' | 'cho-vay'>('vay');

  // Tự động lên lịch notification nhắc trả lãi mỗi khi danh sách thay đổi
  useNhacTraLai();

  if (!maSoChiTieu) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted }}>Vui lòng chọn sổ chi tiêu trước.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerText, { color: colors.text }]}>💰 Vay vốn</Text>
      </View>

      {/* Tab */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabNut, tab === 'vay' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('vay')}
        >
          <Text style={[styles.tabText, { color: tab === 'vay' ? colors.primary : colors.textMuted }]}>🏦 Vay ngân hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabNut, tab === 'cho-vay' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('cho-vay')}
        >
          <Text style={[styles.tabText, { color: tab === 'cho-vay' ? colors.primary : colors.textMuted }]}>💸 Cho vay</Text>
        </TouchableOpacity>
      </View>

      <DanhSachTab loai={tab} maSoChiTieu={maSoChiTieu} colors={colors} isDark={isDark} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 12, marginTop: 8, marginBottom: 2,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1,
  },
  infoBannerText: { fontSize: 11, flex: 1, lineHeight: 16 },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerText: { fontSize: 18, fontWeight: '800' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabNut: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  tongKetRow: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 0 },
  tongKetO: { flex: 1, borderRadius: 10, padding: 10, borderWidth: 1 },
  tongKetNhan: { fontSize: 11, marginBottom: 3 },
  tongKetGiaTri: { fontSize: 13, fontWeight: '800' },

  card: {
    borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, paddingBottom: 6 },
  cardHeaderLeft: { flex: 1, gap: 4 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTen: { fontSize: 15, fontWeight: '700' },
  cardSoTien: { fontSize: 15, fontWeight: '800' },
  trangThaiTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  cardInfo: { paddingHorizontal: 14, paddingBottom: 10, gap: 3 },
  cardInfoText: { fontSize: 12 },

  chiTiet: { padding: 14, borderTopWidth: 1, gap: 4 },
  chiTietTieuDe: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  chiTietBang: { borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  chiTietRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, paddingHorizontal: 10 },
  chiTietNhan: { fontSize: 12 },
  chiTietGiaTri: { fontSize: 12, fontWeight: '700' },
  ghiChu: { fontSize: 12, fontStyle: 'italic', padding: 8, borderWidth: 1, borderRadius: 8, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  rongText: { fontSize: 14, fontStyle: 'italic' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '92%' },
  modalTieuDe: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTieuDeText: { fontSize: 17, fontWeight: '800' },
  formTruong: { marginBottom: 12 },
  formNhan: { fontSize: 12, marginBottom: 4, fontWeight: '600' },
  formInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center' },
  xemTruocBox: { borderRadius: 12, padding: 12, borderWidth: 1.5, marginVertical: 10, gap: 4 },
  xemTruocTieuDe: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  xemTruocDong: { fontSize: 13 },
  xemTruocDivider: { height: 1, marginVertical: 6 },
  nutLuu: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12, marginBottom: 20,
  },
  nutLuuText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
