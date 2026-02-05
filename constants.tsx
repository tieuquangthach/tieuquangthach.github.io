
import { AppData, Screen, BaiHoc } from './types';

// Đường dẫn Logo chuẩn của ứng dụng
export const LOGO_URL = "/logo.png";

// Dữ liệu Chương trình học chuẩn SGK Chân trời sáng tạo
export const SGK_CURRICULUM: Record<string, Record<string, string[]>> = {
  '6': {
    'Chương 1: Số tự nhiên': [
      'Bài 1. Tập hợp. Phần tử của tập hợp',
      'Bài 2. Tập hợp số tự nhiên. Ghi số tự nhiên',
      'Bài 3. Các phép tính trong tập hợp số tự nhiên',
      'Bài 4. Lũy thừa với số mũ tự nhiên',
      'Bài 5. Thứ tự thực hiện các phép tính',
      'Bài 6. Chia hết và chia có dư. Tính chất chia hết của một tổng',
      'Bài 7. Dấu hiệu chia hết cho 2, cho 5',
      'Bài 8. Dấu hiệu chia hết cho 3, cho 9',
      'Bài 9. Ước và bội',
      'Bài 10. Số nguyên tố. Hợp số. Phân tích một số ra thừa số nguyên tố',
      'Bài 11. Hoạt động thực hành và trải nghiệm',
      'Bài 12. Ước chung. Ước chung lớn nhất',
      'Bài 13. Bội chung. Bội chung nhỏ nhất',
      'Bài 14. Hoạt động thực hành và trải nghiệm'
    ],
    'Chương 2: Số nguyên': [
      'Bài 1. Số nguyên âm và tập hợp các số nguyên',
      'Bài 2. Thứ tự trong tập hợp số nguyên',
      'Bài 3. Phép cộng và phép trừ hai số nguyên',
      'Bài 4. Phép nhân và phép chia hết hai số nguyên',
      'Bài 5. Hoạt động thực hành và trải nghiệm: Vui học cùng số nguyên'
    ],
    'Chương 3: Hình học trực quan': [
      'Bài 1. Hình vuông - Tam giác đều - Lục giác đều',
      'Bài 2. Hình chữ nhật - Hình thoi - Hình bình hành - Hình thang cân',
      'Bài 3. Chu vi và diện tích của một số hình trong thực tiễn',
      'Bài 4. Hoạt động thực hành và trải nghiệm: Tính chu vi và diện tích...'
    ],
    'Chương 4: Một số yếu tố thống kê': [
      'Bài 1. Thu thập và phân loại dữ liệu',
      'Bài 2. Biểu diễn dữ liệu trên bảng',
      'Bài 3. Biểu đồ tranh',
      'Bài 4. Biểu đồ cột - Biểu đồ cột kép',
      'Bài 5. Hoạt động thực hành và trải nghiệm: Thu thập dữ liệu...'
    ],
    'Chương 5: Phân số': [
      'Bài 1. Phân số với tử số và mẫu số là số nguyên',
      'Bài 2. Tính chất cơ bản của phân số',
      'Bài 3. So sánh phân số',
      'Bài 4. Phép cộng và phép trừ phân số',
      'Bài 5. Phép nhân và phép chia phân số',
      'Bài 6. Giá trị phân số của một số',
      'Bài 7. Hỗn số',
      'Bài 8. Hoạt động thực hành và trải nghiệm: Phân số quanh ta'
    ],
    'Chương 6: Số thập phân': [
      'Bài 1. Số thập phân',
      'Bài 2. Các phép tính với số thập phân',
      'Bài 3. Làm tròn số thập phân và ước lượng kết quả',
      'Bài 4. Tỉ số và tỉ số phần trăm',
      'Bài 5. Bài toán về tỉ số phần trăm',
      'Bài 6. Hoạt động thực hành và trải nghiệm'
    ],
    'Chương 7: Hình học trực quan (tt)': [
      'Bài 1. Hình có trục đối xứng',
      'Bài 2. Hình có tâm đối xứng',
      'Bài 3. Vai trò của tính đối xứng trong thế giới tự nhiên',
      'Bài 4. Hoạt động thực hành và trải nghiệm'
    ],
    'Chương 8: Hình học phẳng': [
      'Bài 1. Điểm. Đường thẳng',
      'Bài 2. Ba điểm thẳng hàng. Ba điểm không thẳng hàng',
      'Bài 3. Hai đường thẳng cắt nhau, song song. Tia',
      'Bài 4. Đoạn thẳng. Độ dài đoạn thẳng',
      'Bài 5. Trung điểm của đoạn thẳng',
      'Bài 6. Góc',
      'Bài 7. Số đo góc. Các góc đặc biệt',
      'Bài 8. Hoạt động thực hành và trải nghiệm'
    ],
    'Chương 9: Một số yếu tố xác suất': [
      'Bài 1. Phép thử nghiệm - Sự kiện',
      'Bài 2. Xác suất thực nghiệm',
      'Bài 3. Hoạt động thực hành và trải nghiệm'
    ]
  },
  '7': {
    'Chương 1: Số hữu tỉ': [
      'Bài 1. Tập hợp các số hữu tỉ',
      'Bài 2. Các phép tính với số hữu tỉ',
      'Bài 3. Lũy thừa của một số hữu tỉ',
      'Bài 4. Quy tắc dấu ngoặc và quy tắc chuyển vế',
      'Bài 5. Hoạt động thực hành và trải nghiệm: Thực hành tính tiền điện'
    ],
    'Chương 2: Số thực': [
      'Bài 1. Số vô tỉ. Căn bậc hai số học',
      'Bài 2. Số thực. Giá trị tuyệt đối của một số thực',
      'Bài 3. Làm tròn số và ước lượng kết quả',
      'Bài 4. Hoạt động thực hành và trải nghiệm: Tính chỉ số BMI'
    ],
    'Chương 3: Các hình khối trong thực tiễn': [
      'Bài 1. Hình hộp chữ nhật - Hình lập phương',
      'Bài 2. Diện tích xung quanh và thể tích của hình hộp chữ nhật, hình lập phương',
      'Bài 3. Hình lăng trụ đứng tam giác - Hình lăng trụ đứng tứ giác',
      'Bài 4. Diện tích xung quanh và thể tích của hình lăng trụ đứng...',
      'Bài 5. Hoạt động thực hành và trải nghiệm: Các bài toán về đo đạc...'
    ],
    'Chương 4: Góc và đường thẳng song song': [
      'Bài 1. Các góc ở vị trí đặc biệt',
      'Bài 2. Tia phân giác',
      'Bài 3. Hai đường thẳng song song',
      'Bài 4. Định lí và chứng minh một định lí',
      'Bài 5. Hoạt động thực hành và trải nghiệm: Vẽ hai đường thẳng song song...'
    ],
    'Chương 5: Một số yếu tố thống kê': [
      'Bài 1. Thu thập và phân loại dữ liệu',
      'Bài 2. Biểu đồ hình quạt tròn',
      'Bài 3. Biểu đồ đoạn thẳng',
      'Bài 4. Hoạt động thực hành và trải nghiệm: Dùng biểu đồ để phân tích...'
    ],
    'Chương 6: Các đại lượng tỉ lệ': [
      'Bài 1. Tỉ lệ thức - Dãy tỉ số bằng nhau',
      'Bài 2. Đại lượng tỉ lệ thuận',
      'Bài 3. Đại lượng tỉ lệ nghịch',
      'Bài 4. Hoạt động thực hành và trải nghiệm: Các đại lượng tỉ lệ...'
    ],
    'Chương 7: Biểu thức đại số': [
      'Bài 1. Biểu thức số, biểu thức đại số',
      'Bài 2. Đa thức một biến',
      'Bài 3. Phép cộng và phép trừ đa thức một biến',
      'Bài 4. Phép nhân và phép chia đa thức một biến',
      'Bài 5. Hoạt động thực hành và trải nghiệm: Tính điểm trung bình môn...'
    ],
    'Chương 8: Tam giác': [
      'Bài 1. Góc và cạnh của một tam giác',
      'Bài 2. Tam giác bằng nhau',
      'Bài 3. Tam giác cân',
      'Bài 4. Đường vuông góc và đường xiên',
      'Bài 5. Đường trung trực của một đoạn thẳng',
      'Bài 6. Tính chất ba đường trung trực của tam giác',
      'Bài 7. Tính chất ba đường trung tuyến của tam giác',
      'Bài 8. Tính chất ba đường cao của tam giác',
      'Bài 9. Tính chất ba đường phân giác của tam giác'
    ],
    'Chương 9: Một số yếu tố xác suất': [
      'Bài 1. Làm quen với biến cố ngẫu nhiên',
      'Bài 2. Làm quen với xác suất của biến cố ngẫu nhiên',
      'Bài 3. Hoạt động thực hành và trải nghiệm: Nhảy theo xúc xắc'
    ]
  },
  '8': {
    'Chương 1: Biểu thức đại số': [
      'Bài 1. Đơn thức và đa thức nhiều biến',
      'Bài 2. Các phép toán với đa thức nhiều biến',
      'Bài 3. Hằng đẳng thức đáng nhớ',
      'Bài 4. Phân tích đa thức thành nhân tử',
      'Bài 5. Phân thức đại số',
      'Bài 6. Cộng, trừ phân thức',
      'Bài 7. Nhân, chia phân thức'
    ],
    'Chương 2: Các hình khối trong thực tiễn': [
      'Bài 1. Hình chóp tam giác đều - Hình chóp tứ giác đều',
      'Bài 2. Diện tích xung quanh và thể tích của hình chóp...'
    ],
    'Chương 3: Định lí Pythagore. Các loại tứ giác thường gặp': [
      'Bài 1. Định lí Pythagore',
      'Bài 2. Tứ giác',
      'Bài 3. Hình thang - Hình thang cân',
      'Bài 4. Hình bình hành - Hình thoi',
      'Bài 5. Hình chữ nhật - Hình vuông'
    ],
    'Chương 4: Một số yếu tố thống kê': [
      'Bài 1. Thu thập và phân loại dữ liệu',
      'Bài 2. Lựa chọn dạng biểu đồ để biểu diễn dữ liệu',
      'Bài 3. Phân tích dữ liệu',
      'Bài 4. Hoạt động thực hành và trải nghiệm'
    ],
    'Chương 5: Hàm số và đồ thị': [
      'Bài 1. Khái niệm hàm số',
      'Bài 2. Tọa độ của một điểm và đồ thị của hàm số',
      'Bài 3. Hàm số bậc nhất y = ax + b (a ≠ 0)',
      'Bài 4. Hệ số góc của đường thẳng'
    ],
    'Chương 6: Phương trình': [
      'Bài 1. Phương trình bậc nhất một ẩn',
      'Bài 2. Giải bài toán bằng cách lập phương trình bậc nhất'
    ],
    'Chương 7: Định lí Thalès': [
      'Bài 1. Định lí Thalès trong tam giác',
      'Bài 2. Đường trung bình của tam giác',
      'Bài 3. Tính chất đường phân giác của tam giác'
    ],
    'Chương 8: Hình đồng dạng': [
      'Bài 1. Hai tam giác đồng dạng',
      'Bài 2. Các trường hợp đồng dạng của hai tam giác',
      'Bài 3. Các trường hợp đồng dạng của hai tam giác vuông',
      'Bài 4. Hai hình đồng dạng'
    ],
    'Chương 9: Một số yếu tố xác suất': [
      'Bài 1. Mô tả xác suất bằng tỉ số',
      'Bài 2. Xác suất lí thuyết và xác suất thực nghiệm'
    ]
  },
  '9': {
    'Chương 1: Phương trình và hệ phương trình': [
      'Bài 1. Phương trình quy về phương trình bậc nhất một ẩn',
      'Bài 2. Phương trình bậc nhất hai ẩn và hệ phương trình bậc nhất hai ẩn',
      'Bài 3. Giải hệ phương trình bằng phương pháp thế',
      'Bài 4. Giải hệ phương trình bằng phương pháp cộng đại số',
      'Bài 5. Giải bài toán bằng cách lập hệ phương trình bậc nhất hai ẩn'
    ],
    'Chương 2: Bất đẳng thức. Bất phương trình bậc nhất một ẩn': [
      'Bài 1. Bất đẳng thức',
      'Bài 2. Bất phương trình bậc nhất một ẩn'
    ],
    'Chương 3: Căn thức': [
      'Bài 1. Căn bậc hai',
      'Bài 2. Căn bậc ba',
      'Bài 3. Tính chất của phép khai phương',
      'Bài 4. Biến đổi đơn giản biểu thức chứa căn thức bậc hai'
    ],
    'Chương 4: Hệ thức lượng trong tam giác vuông': [
      'Bài 1. Tỉ số lượng giác của góc nhọn',
      'Bài 2. Hệ thức giữa cạnh và góc của tam giác vuông'
    ],
    'Chương 5: Đường tròn': [
      'Bài 1. Đường tròn',
      'Bài 2. Tiếp tuyến của đường tròn',
      'Bài 3. Góc ở tâm, góc nội tiếp',
      'Bài 4. Hình quạt tròn và hình vành khuyên'
    ],
    'Chương 6: Hàm số y = ax² (a ≠ 0) và Phương trình bậc hai một ẩn': [
      'Bài 1. Hàm số và đồ thị của hàm số y = ax² (a ≠ 0)',
      'Bài 2. Phương trình bậc hai một ẩn',
      'Bài 3. Định lí Viète',
      'Bài 4. Giải bài toán bằng cách lập phương trình bậc hai'
    ],
    'Chương 7: Tần số và tần số tương đối': [
      'Bài 1. Bảng tần số và biểu đồ tần số',
      'Bài 2. Bảng tần số tương đối và biểu đồ tần số tương đối',
      'Bài 3. Biểu diễn số liệu ghép nhóm',
      'Bài 4. Hoạt động thực hành và trải nghiệm'
    ],
    'Chương 8: Xác suất của biến cố': [
      'Bài 1. Không gian mẫu và biến cố',
      'Bài 2. Xác suất của biến cố'
    ],
    'Chương 9: Tứ giác nội tiếp. Đa giác đều': [
      'Bài 1. Đường tròn ngoại tiếp tam giác. Đường tròn nội tiếp tam giác',
      'Bài 2. Tứ giác nội tiếp',
      'Bài 3. Đa giác đều và phép quay'
    ],
    'Chương 10: Các hình khối trong thực tiễn': [
      'Bài 1. Hình trụ',
      'Bài 2. Hình nón',
      'Bài 3. Hình cầu'
    ]
  }
};

export const SAMPLE_LESSONS: BaiHoc[] = [
  {
    id: "9-6-1",
    tenBai: "Bài 1. Hàm số và đồ thị của hàm số y = ax² (a ≠ 0)",
    lop: "9",
    chuong: "Chương 6: Hàm số y = ax² (a ≠ 0) và Phương trình bậc hai một ẩn",
    yeuCauCanDat: "Mô tả được tính chất của hàm số y = ax² (a ≠ 0). Nhận biết được đồ thị của hàm số là một đường Parabol.",
    lyThuyet: "1. Tính chất:\n- Nếu a > 0: Hàm số nghịch biến khi x < 0 và đồng biến khi x > 0. Giá trị thấp nhất là y = 0.\n- Nếu a < 0: Hàm số đồng biến khi x < 0 và nghịch biến khi x > 0. Giá trị cao nhất là y = 0.\n\n2. Đồ thị:\nĐồ thị là một đường cong đi qua gốc tọa độ O, nhận trục Oy làm trục đối xứng. Đường cong này gọi là Parabol đỉnh O.",
    baiTap: [
      {
        loai: 'Trắc nghiệm',
        deBai: "Cho hàm số y = -2x². Khẳng định nào sau đây đúng?",
        dapAn: ["A. Hàm số luôn đồng biến", "B. Đồ thị nằm phía trên trục hoành", "C. Hàm số đồng biến khi x < 0", "D. Giá trị thấp nhất của hàm số là y = 0"],
        dapAnDung: "C. Hàm số đồng biến khi x < 0"
      }
    ]
  }
];

export const INITIAL_DATA: AppData = {
  hocSinh: {
    id: "",
    ten: "Học sinh",
    lop: "--",
    diemSo: {
      hocKy1: [],
      hocKy2: []
    },
    thoiGianHoc: { ngay: new Date().toISOString().split('T')[0], soPhut: 0 },
    nhanXet: "Chào mừng bạn đến với Math.TQT."
  },
  allHocSinh: [],
  allLopHoc: [],
  baiHoc: SAMPLE_LESSONS,
  nguoiDung: { username: "", vaiTro: "hocSinh" },
  diemDanh: [],
  nganHangCauHoi: [],
  tatCaDeKiemTra: [],
  danhSachPhieuBaiTap: []
};

export const MENU_ITEMS = [
  { id: Screen.DASHBOARD, label: 'Bảng điều khiển', icon: 'dashboard' },
  { id: Screen.LESSONS, label: 'Học tập & Bài tập', icon: 'book' },
  { id: Screen.RESULTS, label: 'Kết quả học tập', icon: 'trending_up' },
  { id: Screen.LEADERBOARD, label: 'Thi đua', icon: 'leaderboard' },
  { id: Screen.AI_QA, label: 'Hỏi đáp AI', icon: 'smart_toy' },
  { id: Screen.ATTENDANCE, label: 'Điểm danh', icon: 'fact_check' },
  { id: Screen.REMARKS, label: 'Nhận xét', icon: 'comment' },
  { id: Screen.ADMIN_CLASSES, label: 'Quản lý lớp học', icon: 'school' },
  { id: Screen.ADMIN_LESSONS, label: 'Quản lý bài giảng', icon: 'settings_suggest' },
  { id: Screen.ADMIN_WORKSHEETS, label: 'Quản lý phiếu bài tập', icon: 'description' },
  { id: Screen.ADMIN_QUIZZES, label: 'Quản lý đề thi', icon: 'quiz' },
  { id: Screen.ADMIN_STUDENTS, label: 'Quản lý học sinh', icon: 'group' },
];
