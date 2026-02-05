
export interface DiemSo {
  monHoc: string;
  diem: number;
}

export interface HocSinh {
  id: string;
  ten: string;
  lop: string;
  diemSo: {
    hocKy1: DiemSo[];
    hocKy2: DiemSo[];
  };
  thoiGianHoc: {
    ngay: string;
    soPhut: number;
  };
  nhanXet: string;
  user_id?: string;
  username?: string; 
}

export interface LopHoc {
  id: string;
  tenLop: string;
  khoi: string;
  ngayTao?: string;
}

export interface BaiTap {
  id?: string;
  bai_hoc_id?: string;
  loai: 'Trắc nghiệm' | 'Tự luận';
  deBai: string;
  dapAn?: string[];
  dapAnDung?: string;
  doKho?: 'Dễ' | 'Trung bình' | 'Khó' | 'Vận dụng cao';
  chuDe?: string;
  mucDo?: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
}

export interface DeKiemTra {
  id: string;
  tenDe: string;
  moTa: string;
  lop: string;
  thoiGian: number; // phút
  taoBoi: string;
  ngayTao: string;
  cauHoiIds: string[];
}

export interface LuotLamBai {
  id: string;
  de_id: string;
  user_id: string;
  diem: number;
  batDau: string;
  ketThuc: string;
  ketQuaChiTiet: any;
}

export interface BaiHoc {
  id: string;
  tenBai: string;
  lop: string;
  chuong: string;
  lyThuyet: string;
  yeuCauCanDat?: string;
  baiTap: BaiTap[];
}

export interface NguoiDung {
  id?: string;
  username: string;
  password?: string;
  vaiTro: 'hocSinh' | 'giaoVien';
}

export interface DiemDanh {
  id?: string;
  ngay: string;
  hocSinh: string;
  coMat: boolean;
}

export interface PhieuBaiTap {
  id: string;
  tenPhieu: string;
  lop: string;
  monHoc: string;
  noiDung: any; // JSON content
  ngayTao: string;
}

export interface AppData {
  hocSinh: HocSinh;
  allHocSinh: HocSinh[];
  allLopHoc: LopHoc[];
  baiHoc: BaiHoc[];
  nguoiDung: NguoiDung;
  diemDanh: DiemDanh[];
  nganHangCauHoi: BaiTap[];
  tatCaDeKiemTra: DeKiemTra[];
  danhSachPhieuBaiTap: PhieuBaiTap[];
}

export enum Screen {
  DASHBOARD = 'DASHBOARD',
  LESSONS = 'LESSONS',
  LESSON_DETAIL = 'LESSON_DETAIL',
  RESULTS = 'RESULTS',
  LEADERBOARD = 'LEADERBOARD',
  AI_QA = 'AI_QA',
  ATTENDANCE = 'ATTENDANCE',
  REMARKS = 'REMARKS',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD', 
  ADMIN_LESSONS = 'ADMIN_LESSONS',
  ADMIN_STUDENTS = 'ADMIN_STUDENTS',
  ADMIN_CLASSES = 'ADMIN_CLASSES',
  ADMIN_QUIZZES = 'ADMIN_QUIZZES',
  ADMIN_WORKSHEETS = 'ADMIN_WORKSHEETS',
  ADMIN_CONSOLIDATION = 'ADMIN_CONSOLIDATION', // Màn hình Bài tập Củng cố (Từ Dashboard)
  ADMIN_ESSAY = 'ADMIN_ESSAY', // Màn hình Bài tập Tự luận (Mới)
  CONSOLIDATION = 'CONSOLIDATION', // Tab Bài tập Củng cố (Trên Navbar)
  TAKE_QUIZ = 'TAKE_QUIZ',
  SMART_WORKSHEET = 'SMART_WORKSHEET'
}
