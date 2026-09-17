export type LoaiVi = 'TienMat' | 'NganHang' | 'ViDienTu' | 'TheTinDung' | 'Khac';

export interface Vi {
  maVi: number;
  tenVi: string;
  bieuTuong: string;
  loaiVi: LoaiVi;
  soDuBanDau: number;
  daLuuTru: boolean;
}