export interface DanhMucChiTieu {
  maDanhMuc: number;
  tenDanhMuc: string;
  bieuTuong: string;
  tongTien: number;
}

export interface TongQuanThang {
  tongThu: number;
  tongChi: number;
  theoDanhMuc: DanhMucChiTieu[];
}

export interface XuHuongThang {
  thang: number;
  nam: number;
  tongThu: number;
  tongChi: number;
}

export interface GiaoDichNgay {
  maGiaoDich: number;
  loai: 'Thu' | 'Chi' | 'ChuyenKhoan';
  soTien: number;
  ghiChu?: string;
  ngayGiaoDich: string;
  anhBangChung?: string | null;
  tenDanhMuc?: string;
  bieuTuongDanhMuc?: string;
  tenVi: string;
  bieuTuongVi?: string;
}

export interface BaoCaoNgay {
  ngay: string;
  tongThu: number;
  tongChi: number;
  chenhLech: number;
  chiTiet: GiaoDichNgay[];
  theoDanhMuc: DanhMucChiTieu[];
}

export interface NgayTrongThang {
  ngay: string;
  tongThu: number;
  tongChi: number;
}
