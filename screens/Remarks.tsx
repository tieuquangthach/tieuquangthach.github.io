
import React, { useState, useEffect } from 'react';
import { AppData, HocSinh } from '../types';
import { supabase } from '../services/supabaseClient';

interface RemarksProps {
  data: AppData;
  setData: (data: AppData) => void;
}

const Remarks: React.FC<RemarksProps> = ({ data, setData }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [remarkInput, setRemarkInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const selectedStudent = data.allHocSinh.find(s => s.id === selectedStudentId);

  useEffect(() => {
    if (selectedStudent) {
      setRemarkInput(selectedStudent.nhanXet || '');
    } else {
      setRemarkInput('');
    }
  }, [selectedStudentId]);

  const handleSave = async () => {
    if (!selectedStudentId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('hoc_sinh')
        .update({ nhan_xet: remarkInput })
        .eq('id', selectedStudentId);

      if (!error) {
        // Cập nhật local state
        const updatedAllStudents = data.allHocSinh.map(s => 
          s.id === selectedStudentId ? { ...s, nhanXet: remarkInput } : s
        );
        setData({ ...data, allHocSinh: updatedAllStudents });
        
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        alert("Lỗi khi lưu nhận xét: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('') : '?';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Gửi nhận xét giáo viên</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-500 whitespace-nowrap uppercase tracking-wider">Chọn học sinh:</label>
          <select 
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-gray-700 min-w-[200px]"
          >
            <option value="">-- Chọn học sinh --</option>
            {data.allHocSinh.map(s => (
              <option key={s.id} value={s.id}>{s.ten} - Lớp {s.lop}</option>
            ))}
          </select>
        </div>
      </div>
      
      {selectedStudentId ? (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6 animate-fadeIn">
          <div className="flex items-center gap-5 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
            {/* Thay ảnh bằng Avatar chữ cái đầu theo yêu cầu "Xóa ảnh" */}
            <div className="w-14 h-14 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center text-xl font-black shadow-lg">
              {getInitials(selectedStudent?.ten || '')}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{selectedStudent?.ten}</p>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Lớp {selectedStudent?.lop}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Lời nhận xét chuyên môn</label>
            <textarea 
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              className="w-full min-h-[250px] p-5 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 text-gray-800 leading-relaxed shadow-inner bg-gray-50/30"
              placeholder="Thầy/Cô hãy nhập nhận xét chi tiết về học sinh tại đây..."
            ></textarea>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-xs text-gray-400 font-medium">
              Tự động lưu lịch sử nhận xét vào hồ sơ học sinh
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`
                px-10 py-4 rounded-2xl font-black text-white transition-all flex items-center gap-3 shadow-lg active:scale-95
                ${isSaved ? 'bg-green-600 shadow-green-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}
                ${isSaving ? 'opacity-50 cursor-wait' : ''}
              `}
            >
              <span className="material-symbols-outlined">{isSaved ? 'check_circle' : 'save_as'}</span>
              {isSaving ? 'Đang lưu...' : (isSaved ? 'Đã lưu thành công!' : 'Cập nhật nhận xét')}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
          <span className="material-symbols-outlined text-8xl text-gray-100 mb-6">person_search</span>
          <p className="text-gray-400 font-bold text-lg">Vui lòng chọn một học sinh từ danh sách để bắt đầu nhận xét</p>
        </div>
      )}
    </div>
  );
};

export default Remarks;
