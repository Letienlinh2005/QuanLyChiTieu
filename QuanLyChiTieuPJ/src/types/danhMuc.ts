export type LoaiDanhMuc = 'Thu' | 'Chi';

export interface DanhMuc {
    maDanhMuc: number;
    tenDanhMuc: string;
    bieuTuong: string;
    loai: LoaiDanhMuc;
    laMacDinh: boolean;
}