export type LoaiGiaoDich = 'Thu' | 'Chi' | 'ChuyenKhoan';

export interface GiaoDich {
  maGiaoDich: number;
  maVi: number;
  maViDoi: number | null;
  maDanhMuc: number | null;
  loai: LoaiGiaoDich;
  soTien: number;
  ghiChu: string | null;
  ngayGiaoDich: string; // ISO date string 'yyyy-MM-dd'
}

// Giao dịch trả về từ danh sách (GET /giao-dich) có kèm thông tin
// danh mục + ví đã JOIN sẵn ở backend, tiện hiển thị mà không cần
// tra cứu thêm.
export interface GiaoDichChiTiet extends GiaoDich {
  tenDanhMuc: string | null;
  bieuTuongDanhMuc: string | null;
  tenVi: string;
}
