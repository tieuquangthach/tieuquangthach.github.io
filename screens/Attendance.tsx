
import React, { useState } from 'react';
import { AppData } from '../types';
import { supabase } from '../services/supabaseClient';

interface AttendanceProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const Attendance: React.FC<AttendanceProps> = ({ data, setData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [syncing, setSyncing] = useState<string | null>(null);
  
  const currentAttendance = data.diemDanh.filter(d => d.ngay === selectedDate);

  const toggleAttendance = async (studentName: string) => {
    setSyncing(studentName);
    const existing = data.diemDanh.find(d => d.ngay === selectedDate && d.hocSinh === studentName);
    const newStatus = existing ? !existing.coMat : true;

    try {
      if (existing) {
        // Xóa bản ghi cũ để cập nhật trạng thái mới
        await supabase.from('diem_danh').delete().match({ ngay: selectedDate, hoc_sinh: studentName });
      }
      
      const { error } = await supabase.from('diem_danh').insert([
        { ngay: selectedDate, hoc_sinh: studentName, co_mat: newStatus }
      ]);

      if (!error) {
         const newDiemDanh = data.diemDanh.filter(d => !(d.ngay === selectedDate && d.hocSinh === studentName));
         newDiemDanh.push({ ngay: selectedDate, hocSinh: studentName, coMat: newStatus });
         setData({ ...data, diemDanh: newDiemDanh });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Điểm danh lớp hàng ngày</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-400 uppercase">Ngày:</span>
          <input 
            type="date" 
            className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-gray-700"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left">
              <th className="px-8 py-5 font-black text-gray-600 uppercase text-xs tracking-widest">Họ và tên học sinh</th>
              <th className="px-8 py-5 font-black text-gray-600 uppercase text-xs tracking-widest text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.allHocSinh.map((st) => {
              const info = currentAttendance.find(d => d.hocSinh === st.ten);
              const isPresent = info ? info.coMat : false;
              const isSyncing = syncing === st.ten;

              return (
                <tr key={st.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        {st.ten.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-bold text-gray-800">{st.ten}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => toggleAttendance(st.ten)}
                        disabled={isSyncing}
                        className={`
                          flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black uppercase tracking-tighter transition-all shadow-sm active:scale-95
                          ${isPresent 
                            ? 'bg-green-500 text-white shadow-green-100' 
                            : 'bg-red-500 text-white shadow-red-100'}
                          ${isSyncing ? 'opacity-50 cursor-wait' : ''}
                        `}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isSyncing ? 'sync' : (isPresent ? 'check_circle' : 'cancel')}
                        </span>
                        {isPresent ? 'Hiện diện' : 'Vắng mặt'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.allHocSinh.length === 0 && (
          <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">Đang tải danh sách học sinh...</div>
        )}
      </div>
      
      <div className="flex items-center gap-4 p-5 bg-blue-600 text-white rounded-2xl shadow-lg">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined">sync</span>
        </div>
        <div>
          <p className="font-bold">Đã đồng bộ hóa</p>
          <p className="text-xs text-blue-100 font-medium">Kết quả điểm danh được cập nhật tức thì lên hệ thống lưu trữ.</p>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
