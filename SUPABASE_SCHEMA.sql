
-- Bảng phieu_bai_tap dùng chung cho cả Luyện tập và Củng cố
-- Phân loại bằng cột 'mon_hoc': 
--   1. 'Toán' hoặc 'Luyện tập' -> Bài tập Luyện tập
--   2. 'Củng cố' -> Bài tập Củng cố

CREATE TABLE IF NOT EXISTS phieu_bai_tap (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ten_phieu TEXT NOT NULL,
    lop TEXT NOT NULL, -- '6', '7', '8', '9'
    mon_hoc TEXT DEFAULT 'Toán', -- Lưu loại bài tập
    noi_dung JSONB, -- Chứa cấu trúc câu hỏi hoặc thông tin file upload
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo Index để lọc nhanh theo loại bài tập và lớp
CREATE INDEX IF NOT EXISTS idx_phieu_bai_tap_mon_hoc ON phieu_bai_tap(mon_hoc);
CREATE INDEX IF NOT EXISTS idx_phieu_bai_tap_lop ON phieu_bai_tap(lop);

-- Ghi chú: Không cần tạo bảng riêng để dễ dàng quản lý chung component React
