
import React from 'react';
import { AppData, HocSinh } from '../types';

interface LeaderboardProps {
  data: AppData;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
  // Helper tính tổng điểm của một học sinh
  const calculateTotalScore = (student: HocSinh) => {
    const hk1Total = student.diemSo.hocKy1.reduce((sum, item) => sum + item.diem, 0);
    const hk2Total = student.diemSo.hocKy2.reduce((sum, item) => sum + item.diem, 0);
    return hk1Total + hk2Total;
  };

  // Helper tính số lượng bài (đầu điểm)
  const calculateLessonCount = (student: HocSinh) => {
      return student.diemSo.hocKy1.length + student.diemSo.hocKy2.length;
  };

  const getInitials = (name: string) => {
      const parts = name.trim().split(' ');
      if (parts.length === 0) return '?';
      return parts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // 1. Lấy danh sách học sinh, tính điểm
  // 2. Sắp xếp giảm dần theo điểm
  // 3. Lọc bỏ học sinh không có điểm (tùy chọn, ở đây giữ lại nhưng xếp cuối)
  const rankedStudents = [...data.allHocSinh]
    .map(s => ({
        ...s,
        totalScore: calculateTotalScore(s),
        lessons: calculateLessonCount(s)
    }))
    .sort((a, b) => b.totalScore - a.totalScore); // Sort Descending

  const top1 = rankedStudents[0];
  const top2 = rankedStudents[1];
  const top3 = rankedStudents[2];
  const rest = rankedStudents.slice(3);

  if (rankedStudents.length === 0) {
      return (
          <div className="animate-fadeIn py-20 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="material-symbols-outlined text-5xl text-slate-300">leaderboard</span>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Chưa có dữ liệu xếp hạng</h3>
              <p className="text-slate-400 font-medium">Bảng xếp hạng sẽ cập nhật khi có học sinh tham gia học tập.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Bảng Phong Thần</h2>
        <p className="text-slate-500 font-medium">Vinh danh những chiến binh Math.TQT xuất sắc nhất!</p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-16 px-4">
        
        {/* 2nd Place */}
        {top2 && (
            <div className="flex flex-col items-center order-2 md:order-1 relative z-10">
            <div className="relative mb-4 group">
                <div className="w-20 h-20 rounded-[2rem] border-4 border-slate-200 bg-white flex items-center justify-center text-slate-400 font-black text-2xl shadow-xl shadow-slate-200 group-hover:-translate-y-2 transition-transform duration-500">
                {getInitials(top2.ten)}
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-400 rounded-lg flex items-center justify-center text-white font-black border-2 border-white shadow-md rotate-45">
                    <span className="-rotate-45">2</span>
                </div>
            </div>
            <p className="font-bold text-slate-700 max-w-[120px] text-center truncate">{top2.ten}</p>
            <p className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md mt-1">{top2.totalScore.toFixed(1)} điểm</p>
            <div className="w-24 h-28 bg-gradient-to-t from-slate-200 to-slate-50 rounded-t-[2rem] mt-4 opacity-50"></div>
            </div>
        )}

        {/* 1st Place */}
        {top1 && (
            <div className="flex flex-col items-center order-1 md:order-2 relative z-20 -mt-10">
            <span className="material-symbols-outlined text-[#ffc107] text-5xl mb-2 animate-bounce drop-shadow-lg">crown</span>
            <div className="relative mb-4 group">
                <div className="w-28 h-28 rounded-[2.5rem] border-4 border-[#ffc107] bg-yellow-50 flex items-center justify-center text-yellow-600 font-black text-3xl shadow-2xl shadow-yellow-200 group-hover:-translate-y-2 transition-transform duration-500">
                {getInitials(top1.ten)}
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#ffc107] rounded-xl flex items-center justify-center text-white font-black border-4 border-white shadow-lg rotate-12">
                    <span className="-rotate-12">1</span>
                </div>
            </div>
            <p className="font-black text-slate-900 text-lg max-w-[150px] text-center truncate">{top1.ten}</p>
            <div className="flex items-center gap-1 mt-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg">
                <span className="material-symbols-outlined text-sm">military_tech</span>
                <p className="text-sm font-black">{top1.totalScore.toFixed(1)} điểm</p>
            </div>
            <div className="w-32 h-40 bg-gradient-to-t from-yellow-100 to-yellow-50 rounded-t-[2.5rem] mt-4 border-t-4 border-yellow-200"></div>
            </div>
        )}

        {/* 3rd Place */}
        {top3 && (
            <div className="flex flex-col items-center order-3 md:order-3 relative z-10">
            <div className="relative mb-4 group">
                <div className="w-20 h-20 rounded-[2rem] border-4 border-orange-200 bg-white flex items-center justify-center text-orange-400 font-black text-2xl shadow-xl shadow-orange-100 group-hover:-translate-y-2 transition-transform duration-500">
                {getInitials(top3.ten)}
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-400 rounded-lg flex items-center justify-center text-white font-black border-2 border-white shadow-md -rotate-12">
                    <span className="rotate-12">3</span>
                </div>
            </div>
            <p className="font-bold text-slate-700 max-w-[120px] text-center truncate">{top3.ten}</p>
            <p className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md mt-1">{top3.totalScore.toFixed(1)} điểm</p>
            <div className="w-24 h-20 bg-gradient-to-t from-orange-100 to-orange-50 rounded-t-[2rem] mt-4 opacity-50"></div>
            </div>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {rest.length > 0 ? (
            <div className="divide-y divide-slate-50">
            {rest.map((st, i) => (
                <div key={st.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                    <span className="w-8 font-black text-center text-slate-300 text-lg group-hover:text-blue-500 transition-colors">{i + 4}</span>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    {getInitials(st.ten)}
                    </div>
                    <div>
                    <p className="font-bold text-slate-700 text-sm group-hover:text-blue-700">{st.ten}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Lớp {st.lop}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-slate-800 text-sm group-hover:text-blue-600">{st.totalScore.toFixed(1)} pts</p>
                    <p className="text-[10px] text-slate-400 font-bold">{st.lessons} bài</p>
                </div>
                </div>
            ))}
            </div>
        ) : (
            <div className="p-10 text-center text-slate-300 font-bold text-sm italic">
                Chưa có thêm học sinh nào trong danh sách.
            </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
