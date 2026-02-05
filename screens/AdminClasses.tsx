
import React, { useState } from 'react';
import { AppData, LopHoc } from '../types';
import { supabase } from '../services/supabaseClient';

interface AdminClassesProps {
  data: AppData;
  onGoToStudents: (className: string) => void;
  onAddClass: (className: string, grade: string, shouldRedirect: boolean) => void;
  onRefresh: () => void;
}

const AdminClasses: React.FC<AdminClassesProps> = ({ data, onGoToStudents, onAddClass, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<LopHoc | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('6');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const classStats = data.allLopHoc.map(cls => {
    const studentsInClass = data.allHocSinh.filter(s => s.lop === cls.tenLop);
    return {
      id: cls.id,
      name: cls.tenLop,
      khoi: cls.khoi,
      count: studentsInClass.length,
      attendanceRate: studentsInClass.length > 0 ? 95 : 0 
    };
  });

  const handleOpenAddModal = () => {
    setEditingClass(null);
    setNewClassName('');
    setNewClassGrade('6');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cls: LopHoc) => {
    setEditingClass(cls);
    setNewClassName(cls.tenLop);
    setNewClassGrade(cls.khoi);
    setIsModalOpen(true);
  };

  const handleSave = async (shouldRedirect: boolean) => {
    if (!newClassName.trim()) return;
    
    setIsProcessing(true);
    try {
      if (editingClass) {
        // Cập nhật lớp hiện có
        const { error } = await supabase
          .from('lop_hoc')
          .update({ ten_lop: newClassName.trim(), khoi: newClassGrade })
          .eq('id', editingClass.id);
        
        if (error) throw error;
        
        // Nếu tên lớp thay đổi, cần cập nhật cả tên lớp cho học sinh trong lớp đó
        if (editingClass.tenLop !== newClassName.trim()) {
          const { error: studentUpdateError } = await supabase
            .from('hoc_sinh')
            .update({ lop: newClassName.trim() })
            .eq('lop', editingClass.tenLop);
          
          if (studentUpdateError) console.warn("Lỗi cập nhật tên lớp cho học sinh:", studentUpdateError);
        }

        alert(`Đã cập nhật thông tin lớp ${newClassName}!`);
        onRefresh();
        setIsModalOpen(false);
      } else {
        // Thêm lớp mới (Dùng callback từ App.tsx)
        onAddClass(newClassName.trim(), newClassGrade, shouldRedirect);
        setIsModalOpen(false);
      }
    } catch (err: any) {
      alert("Lỗi khi xử lý: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (window.confirm(`Thầy Thạch ơi, Thầy có chắc muốn xóa lớp ${name} không? Thao tác này không xóa học sinh nhưng sẽ làm mất liên kết lớp.`)) {
      setIsDeleting(id);
      try {
        const { error } = await supabase.from('lop_hoc').delete().eq('id', id);
        if (error) throw error;
        onRefresh();
      } catch (err: any) {
        alert("Lỗi khi xóa lớp: " + err.message);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Modal Thêm/Sửa lớp học */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl border-t-8 border-blue-600 animate-fadeIn relative overflow-hidden">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="mb-8">
              <h3 className="text-3xl font-black text-slate-800 leading-tight">
                {editingClass ? 'Sửa thông tin lớp' : 'Thêm lớp học'}
              </h3>
              <p className="text-slate-400 text-sm font-medium mt-1">
                {editingClass ? `Đang chỉnh sửa lớp ${editingClass.tenLop}` : 'Khởi tạo một nhóm học tập mới cho Math.TQT.'}
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khối lớp</label>
                <div className="grid grid-cols-4 gap-3">
                  {['6', '7', '8', '9'].map(grade => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setNewClassGrade(grade)}
                      className={`py-3 rounded-2xl font-black transition-all ${newClassGrade === grade ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      Khối {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên lớp học</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: 9A1, 6B..."
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white font-bold text-slate-700 transition-all"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave(true)}
                  autoFocus
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                {editingClass ? (
                  <button 
                    onClick={() => handleSave(false)}
                    disabled={isProcessing}
                    className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
                  >
                    {isProcessing ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                    <span className="material-symbols-outlined">save</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleSave(true)}
                      disabled={isProcessing}
                      className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
                    >
                      Lưu & Thêm học sinh
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                    <button 
                      onClick={() => handleSave(false)}
                      disabled={isProcessing}
                      className="w-full py-4 bg-white text-slate-500 border-2 border-slate-100 rounded-[1.5rem] font-black text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      Chỉ tạo lớp
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Quản lý lớp học</h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Quản lý danh sách lớp học độc lập (ngay cả khi chưa có học sinh).</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng số lớp</p>
            <p className="text-xl font-black text-blue-600">{data.allLopHoc.length}</p>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng học sinh</p>
            <p className="text-xl font-black text-slate-800">{data.allHocSinh.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Thẻ Thêm lớp mới */}
        <div 
          onClick={handleOpenAddModal}
          className="bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-all duration-500 min-h-[280px]"
        >
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 group-hover:text-blue-600 group-hover:bg-white group-hover:scale-110 transition-all mb-6 shadow-sm border border-slate-50">
            <span className="material-symbols-outlined text-5xl">add</span>
          </div>
          <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs group-hover:text-blue-600 transition-colors">Thêm lớp học mới</p>
          <p className="text-[10px] text-slate-300 font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Nhấp để khởi tạo lớp</p>
        </div>

        {classStats.map((cls) => (
          <div key={cls.id} className="bg-white rounded-[2.5rem] border border-slate-50 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-9xl text-slate-50 group-hover:text-blue-50 transition-colors pointer-events-none">
              school
            </span>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-100">
                  {cls.name}
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex gap-1 mb-1">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const originalCls = data.allLopHoc.find(l => l.id === cls.id);
                        if (originalCls) handleOpenEditModal(originalCls);
                      }}
                      className="p-2 text-slate-200 hover:text-blue-500 transition-colors"
                      title="Sửa lớp"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }}
                      className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                      title="Xóa lớp"
                      disabled={isDeleting === cls.id}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isDeleting === cls.id ? 'sync' : 'delete'}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-green-500 flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Khối {cls.khoi}
                  </p>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-800 mb-2">Lớp {cls.name}</h3>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-medium">Sĩ số:</span>
                  <span className={`font-black ${cls.count > 0 ? 'text-slate-800' : 'text-orange-400'}`}>
                    {cls.count > 0 ? `${cls.count} em` : 'Chưa có HS'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-medium">Chuyên cần:</span>
                  <span className="font-black text-blue-600">{cls.attendanceRate}%</span>
                </div>
              </div>

              <div className="mt-auto">
                <button 
                  onClick={() => onGoToStudents(cls.name)}
                  className="w-full py-4 bg-slate-50 text-slate-600 group-hover:bg-blue-600 group-hover:text-white rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-inner"
                >
                  {cls.count > 0 ? 'Xem danh sách lớp' : 'Thêm học sinh ngay'}
                  <span className="material-symbols-outlined text-lg">
                    {cls.count > 0 ? 'chevron_right' : 'person_add'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminClasses;
