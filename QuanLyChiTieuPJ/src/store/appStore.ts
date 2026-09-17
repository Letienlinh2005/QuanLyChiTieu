import { create } from 'zustand';

interface AppState {
  maSoChiTieu: number | null;
  chonSoChiTieu: (maSoChiTieu: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  maSoChiTieu: null,
  chonSoChiTieu: (maSoChiTieu) => set({ maSoChiTieu }),
}));