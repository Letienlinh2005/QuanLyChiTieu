// Đổi lại theo địa chỉ backend của bạn.
// Khi test trên điện thoại thật/emulator, KHÔNG dùng "localhost"
// vì điện thoại không hiểu localhost là máy tính của bạn.
// - Android emulator: dùng 10.0.2.2
// - Điện thoại thật + Expo Go: dùng địa chỉ IP LAN của máy tính (vd 192.168.1.5)

export const API_BASE_URL = 'http://192.168.1.5:3000/api';