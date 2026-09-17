export function formatCurrency(soTien: number): string {
  return soTien.toLocaleString('vi-VN') + ' đ';
}