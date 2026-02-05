
import React from 'react';
import { HocSinh, AppData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ResultsProps {
  hocSinh: HocSinh;
  data: AppData; // Thêm data để tính tổng số phiếu
}

const Results: React.FC<ResultsProps> = ({ hocSinh, data }) => {
  const chartData = [
    ...hocSinh.diemSo.hocKy1.map(d => ({ name: `${d.monHoc} (HK1)`, value: d.diem, semester: 'HK1' })),
    ...hocSinh.diemSo.hocKy2.map(d => ({ name: `${d.monHoc} (HK2)`, value: d.diem, semester: 'HK2' })),
  ];

  // Tính tổng điểm tích lũy
  const totalScore = chartData.reduce((acc, curr) => acc + curr.value, 0);
  
  // Tính số bài tập đã làm (Dựa trên số đầu điểm hiện có - giả lập vì chưa lưu lịch sử làm bài chi tiết)
  const completedExercises = chartData.length;
  
  // Tổng số phiếu bài tập hiện có trên hệ thống (lọc theo khối của học sinh nếu có)
  const studentGrade = hocSinh.lop !== '--' ? hocSinh.lop.match(/\d+/)?.[0] : null;
  const totalAvailable = data.danhSachPhieuBaiTap.filter(w => 
    !studentGrade || w.lop === studentGrade
  ).length;

  // Nếu tổng số bài có sẵn ít hơn số bài đã làm (do dữ liệu mẫu), lấy max
  const displayTotal = Math.max(totalAvailable, completedExercises + 5); 

  return (
    <div className="space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tiến độ học tập</h2>

      {/* --- NEW SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Tiến độ làm bài */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
              <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Bài tập hoàn thành</p>
                  <div className="flex items-baseline gap-2">
                      <h3 className="text-5xl font-black">{completedExercises}</h3>
                      <span className="text-2xl font-bold opacity-60">/ {displayTotal}</span>
                  </div>
                  <div className="w-full bg-black/20 h-2 rounded-full mt-6 overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${Math.min((completedExercises / displayTotal) * 100, 100)}%` }}
                      ></div>
                  </div>
                  <p className="text-xs font-bold mt-3 opacity-90">Em đã hoàn thành {Math.round((completedExercises / displayTotal) * 100)}% chặng đường!</p>
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[140px] opacity-10 rotate-12">assignment_turned_in</span>
          </div>

          {/* Card 2: Tổng điểm tích lũy */}
          <div className="bg-gradient-to-br from-[#FFCA28] to-orange-400 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-100 relative overflow-hidden">
              <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2 text-slate-800">Điểm số tích lũy</p>
                  <div className="flex items-baseline gap-2">
                      <h3 className="text-5xl font-black text-slate-900">{totalScore.toFixed(1)}</h3>
                      <span className="text-xl font-bold text-slate-700">điểm</span>
                  </div>
                  <div className="flex items-center gap-2 mt-6 bg-white/20 w-fit px-4 py-2 rounded-xl backdrop-blur-sm">
                      <span className="material-symbols-outlined text-slate-800">emoji_events</span>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Hạng Thành Viên: Tích cực</span>
                  </div>
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[140px] text-slate-900 opacity-10 rotate-12">military_tech</span>
          </div>
      </div>

      {/* Grade Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined">history_edu</span>
            </div>
            Điểm Học kỳ 1
          </h3>
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest font-black">
                <th className="pb-4">Môn học</th>
                <th className="pb-4 text-right">Điểm số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hocSinh.diemSo.hocKy1.map((d, i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4 font-bold text-slate-600 pl-2">{d.monHoc}</td>
                  <td className="py-4 text-right font-black text-blue-600 pr-2">{d.diem.toFixed(1)}</td>
                </tr>
              ))}
              {hocSinh.diemSo.hocKy1.length === 0 && (
                  <tr><td colSpan={2} className="py-8 text-center text-slate-300 font-bold italic">Chưa có dữ liệu điểm HK1</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-slate-800">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <span className="material-symbols-outlined">stars</span>
            </div>
            Điểm Học kỳ 2
          </h3>
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest font-black">
                <th className="pb-4">Môn học</th>
                <th className="pb-4 text-right">Điểm số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hocSinh.diemSo.hocKy2.map((d, i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4 font-bold text-slate-600 pl-2">{d.monHoc}</td>
                  <td className="py-4 text-right font-black text-green-600 pr-2">{d.diem.toFixed(1)}</td>
                </tr>
              ))}
              {hocSinh.diemSo.hocKy2.length === 0 && (
                  <tr><td colSpan={2} className="py-8 text-center text-slate-300 font-bold italic">Chưa có dữ liệu điểm HK2</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="text-lg font-black mb-8 flex items-center gap-3 text-slate-800">
           <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <span className="material-symbols-outlined">bar_chart</span>
           </div>
          Biểu đồ năng lực
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} dy={10} />
              <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: '#f8f9fa' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.semester === 'HK1' ? '#3b82f6' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Remarks */}
      <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-200">
        <h3 className="text-lg font-black mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">chat</span>
          Lời nhắn từ Thầy Cô
        </h3>
        <p className="italic opacity-90 font-medium text-lg leading-relaxed">"{hocSinh.nhanXet}"</p>
      </div>
    </div>
  );
};

export default Results;
