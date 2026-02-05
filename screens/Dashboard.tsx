
import React from 'react';
import { AppData, NguoiDung, PhieuBaiTap, HocSinh } from '../types';

interface DashboardProps {
  data: AppData;
  user: NguoiDung | null;
  onNavigateToLesson: (id: string) => void;
  onNavigateToAI: () => void;
  onOpenWorksheet: (worksheet: PhieuBaiTap) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, user, onNavigateToLesson, onNavigateToAI, onOpenWorksheet }) => {
  const isGiaoVien = user?.vaiTro === 'giaoVien';

  // --- LOGIC HIỂN THỊ DỮ LIỆU ---
  
  // 1. Xác định khối lớp để lọc bài tập
  // Nếu là học sinh: Lấy số khối từ lớp (VD: "9A" -> "9")
  // Nếu là giáo viên: Hiển thị bài tập của tất cả các khối (studentGradeStr = null)
  const studentGradeStr = (!isGiaoVien && data.hocSinh.lop !== '--') 
    ? data.hocSinh.lop.match(/\d+/)?.[0] 
    : null;
  
  // 2. Lấy 4 phiếu bài tập mới nhất
  // Nếu studentGradeStr có giá trị -> Lọc theo khối
  // Nếu là Học sinh -> HIỆN PHIẾU TỰ LUYỆN HOẶC TỰ LUẬN
  // Nếu là Giáo viên -> Hiện tất cả
  const worksheetsToDisplay = data.danhSachPhieuBaiTap
    .filter(w => {
       const matchGrade = !studentGradeStr || w.lop === studentGradeStr;
       
       const isConsolidation = w.monHoc === 'Củng cố' || w.monHoc === 'Tự luyện';
       const isEssay = w.monHoc === 'Tự luận';
       
       // Học sinh thấy: Tự luyện + Tự luận. Giáo viên thấy: Tất cả.
       const matchType = isGiaoVien ? true : (isConsolidation || isEssay); 
       
       return matchGrade && matchType;
    })
    .slice(0, 4);

  // Hàm helper xác định nhãn loại bài tập
  const getWorksheetLabel = (ws: PhieuBaiTap) => {
     if (ws.monHoc === 'Củng cố' || ws.monHoc === 'Tự luyện') return 'TỰ LUYỆN';
     if (ws.monHoc === 'Tự luận') return 'TỰ LUẬN';
     return 'LUYỆN TẬP';
  };

  // Hàm helper xác định màu sắc badge dựa trên loại bài
  const getBadgeColorClass = (ws: PhieuBaiTap) => {
    if (ws.monHoc === 'Củng cố' || ws.monHoc === 'Tự luyện') {
        // Màu xanh lá (Emerald) cho Tự luyện
        return 'bg-emerald-500 border-emerald-600 shadow-[0_4px_10px_rgba(16,185,129,0.4)]';
    }
    if (ws.monHoc === 'Tự luận') {
        // Màu đỏ hồng (Rose) cho Tự luận
        return 'bg-rose-500 border-rose-600 shadow-[0_4px_10px_rgba(225,29,72,0.4)]';
    }
    // Màu xanh dương (Blue) mặc định cho Luyện tập
    return 'bg-[#0055ff] border-[#0044cc] shadow-[0_4px_10px_rgba(0,85,255,0.4)]';
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isGiaoVien ? `Chào mừng Thầy Tiêu Quang Thạch! 👋` : `Xin chào, ${data.hocSinh.ten.split(' ').pop()}! 👋`}
          </h2>
          <p className="text-gray-500 font-medium">
            {isGiaoVien ? 'Thầy đang xem giao diện bài tập của học sinh.' : 'Hôm nay em muốn chinh phục bài toán nào?'}
          </p>
        </div>
        <div className="bg-white px-5 py-2.5 rounded-2xl border border-teal-100 shadow-sm flex items-center gap-3 w-fit">
           <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)] ${isGiaoVien ? 'bg-blue-500' : 'bg-teal-500'}`}></div>
           <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
             {isGiaoVien ? 'Giáo viên' : `Lớp ${data.hocSinh.lop}`}
           </span>
        </div>
      </section>

      {/* SECTION 1: 4 BÀI TẬP MỚI NHẤT */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">assignment_add</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Bài tập mới nhất</h3>
          </div>
          <button className="text-teal-600 font-bold text-xs uppercase tracking-widest hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors">Xem tất cả</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {worksheetsToDisplay.map((ws, index) => {
             return (
             <div 
                key={ws.id} 
                onClick={() => onOpenWorksheet(ws)}
                className="group relative bg-white rounded-[2rem] p-6 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center overflow-hidden"
             >
                {/* Decorative Gradient Header */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50/50 to-transparent"></div>
                
                {/* Badge Mới */}
                {index === 0 && (
                  <div className="absolute top-0 left-0 bg-[#ef4444] text-white text-[9px] font-black px-3 py-1.5 rounded-br-xl uppercase tracking-widest z-20 shadow-lg shadow-red-200">
                    Mới nhất
                  </div>
                )}

                {/* Header Pills (Khối Lớp + Loại Bài Tập) */}
                <div className="relative z-10 flex items-center justify-center gap-2 mb-5 w-full mt-2">
                    {/* Pill 1: TOÁN + LỚP (Màu Cam) */}
                    <span className="bg-[#ff9f0a] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_4px_10px_rgba(255,159,10,0.4)] border border-[#fb8c00]">
                        TOÁN {ws.lop}
                    </span>
                    {/* Pill 2: LOẠI BÀI TẬP (Màu sắc động) */}
                    <span 
                        className={`text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border shadow-[0_4px_10px_rgba(0,0,0,0.1)]
                        ${getBadgeColorClass(ws)}`}
                    >
                        {getWorksheetLabel(ws)}
                    </span>
                </div>
                
                {/* Title (To, Đậm, In Hoa) */}
                <h4 className="relative z-10 text-xl font-black text-slate-800 uppercase leading-snug mb-3 group-hover:text-[#0055ff] transition-colors line-clamp-2 px-1">
                  {ws.tenPhieu}
                </h4>
                
                {/* Info Line */}
                <p className="relative z-10 text-[10px] font-bold text-slate-400 mb-6 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                   {new Date(ws.ngayTao).toLocaleDateString('vi-VN')}
                </p>

                {/* Footer Action */}
                <div className="relative z-10 mt-auto w-full">
                   <div className="w-full py-3.5 bg-[#f0f9ff] text-[#0055ff] rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-[#0055ff] group-hover:text-white transition-all flex items-center justify-center gap-2">
                     {isGiaoVien ? 'Xem chi tiết' : 'Làm bài ngay'} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                   </div>
                </div>
             </div>
          )})}
          
          {/* Empty State */}
          {worksheetsToDisplay.length === 0 && (
            <div className="col-span-full bg-slate-50 rounded-[2rem] py-16 text-center border-2 border-dashed border-slate-200">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                 <span className="material-symbols-outlined text-3xl text-slate-300">history_edu</span>
               </div>
               <p className="text-slate-400 font-bold text-sm">Hiện chưa có bài tập mới.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer Quote */}
      <div className="text-center py-4 opacity-50">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Không có áp lực • Không có kim cương</p>
      </div>
    </div>
  );
};

export default Dashboard;
