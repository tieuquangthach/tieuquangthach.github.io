
import React from 'react';
import { Screen } from '../types';

interface AdminDashboardProps {
  onNavigate: (screen: Screen) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const adminModules = [
    { 
      id: Screen.ADMIN_CLASSES, 
      label: 'Quản lý Lớp học', 
      desc: 'Tạo lớp, thêm học sinh',
      icon: 'school',
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      id: Screen.ADMIN_STUDENTS, 
      label: 'Quản lý Học sinh', 
      desc: 'Hồ sơ, tài khoản, mật khẩu',
      icon: 'group',
      color: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    { 
      id: Screen.ADMIN_LESSONS, 
      label: 'Quản lý Bài giảng', 
      desc: 'Soạn bài, lý thuyết, AI',
      icon: 'settings_suggest',
      color: 'bg-teal-600',
      textColor: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    { 
      id: Screen.ADMIN_WORKSHEETS, 
      label: 'BÀI TẬP LUYỆN TẬP', 
      desc: 'Kho phiếu bài tập rèn luyện',
      icon: 'description',
      color: 'bg-orange-600',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    { 
      id: Screen.ADMIN_CONSOLIDATION, 
      label: 'BÀI TẬP TỰ LUYỆN', 
      desc: 'Phiếu ôn tập & tự luyện kiến thức',
      icon: 'library_add_check', 
      color: 'bg-emerald-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      id: Screen.ADMIN_ESSAY, 
      label: 'BÀI TẬP TỰ LUẬN', 
      desc: 'Câu hỏi ngắn mức độ vận dụng',
      icon: 'edit_note', 
      color: 'bg-rose-600',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50'
    },
    { 
      id: Screen.ADMIN_QUIZZES, 
      label: 'Ngân hàng đề', 
      desc: 'Kho câu hỏi trắc nghiệm',
      icon: 'quiz',
      color: 'bg-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      id: Screen.ATTENDANCE, 
      label: 'Điểm danh', 
      desc: 'Theo dõi chuyên cần',
      icon: 'fact_check',
      color: 'bg-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      id: Screen.REMARKS, 
      label: 'Nhận xét', 
      desc: 'Gửi lời nhắn cho học sinh',
      icon: 'comment',
      color: 'bg-pink-600',
      textColor: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
  ];

  return (
    <div className="animate-fadeIn space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-4xl font-black text-slate-800 tracking-tight">Khu vực Quản trị</h2>
           <p className="text-slate-400 font-medium text-lg mt-1">Chọn một công cụ để bắt đầu quản lý hệ thống.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {adminModules.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[100%] opacity-10 transition-transform group-hover:scale-125 ${item.color}`}></div>
            
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${item.bgColor} ${item.textColor}`}>
              <span className="material-symbols-outlined text-3xl">{item.icon}</span>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors uppercase">
              {item.label}
            </h3>
            <p className="text-sm font-medium text-slate-400">
              {item.desc}
            </p>
            
            <div className="mt-8 flex items-center text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-blue-600 transition-colors gap-2">
              Truy cập <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </button>
        ))}
      </div>
      
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden mt-8 shadow-2xl">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
               <h3 className="text-3xl font-black">Báo cáo tổng quan</h3>
               <p className="text-slate-400 max-w-lg">Xem thống kê chi tiết về tình hình học tập, chuyên cần và kết quả kiểm tra của toàn trường.</p>
               <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-900/50 flex items-center gap-3 w-fit">
                  Xem báo cáo <span className="material-symbols-outlined">bar_chart</span>
               </button>
            </div>
            <div className="w-40 h-40 bg-white/5 rounded-full flex items-center justify-center border-4 border-white/10">
               <span className="material-symbols-outlined text-6xl text-white/80">pie_chart</span>
            </div>
         </div>
         <span className="material-symbols-outlined absolute -left-10 -bottom-20 text-[300px] text-white/5 pointer-events-none">analytics</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
