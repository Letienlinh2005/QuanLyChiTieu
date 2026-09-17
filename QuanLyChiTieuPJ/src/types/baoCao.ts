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
