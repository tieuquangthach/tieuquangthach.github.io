
import React, { useState, useEffect, useRef } from 'react';
import { HocSinh, LopHoc } from '../types';
import { supabase } from '../services/supabaseClient';

interface AdminStudentsProps {
  students: HocSinh[];
  allLopHoc: LopHoc[];
  onRefresh: () => void;
  initialClass?: string | null;
  onResetInitialClass?: () => void;
  filterClass?: string | null;
  onSetFilterClass?: (cls: string | null) => void;
  onClearFilter?: () => void;
}

const AdminStudents: React.FC<AdminStudentsProps> = ({ 
  students, 
  allLopHoc,
  onRefresh, 
  initialClass, 
  onResetInitialClass,
  filterClass,
  onSetFilterClass,
  onClearFilter
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<any>(null);
  const [currentStudent, setCurrentStudent] = useState<any>({
    ten: '', lop: '', username: '', password: ''
  });
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  // Custom Dropdown State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Xử lý đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Xử lý khi có lớp học được truyền từ trang AdminClasses sang
  useEffect(() => {
    if (initialClass) {
      setCurrentStudent({
        ten: '', 
        lop: initialClass, 
        username: '', 
        password: ''
      });
      setIsEditing(true);
      if (onResetInitialClass) onResetInitialClass();
    }
  }, [initialClass]);

  // Lọc danh sách học sinh theo lớp nếu có filterClass
  const filteredStudents = filterClass 
    ? students.filter(s => s.lop === filterClass)
    : students;

  const handleSave = async () => {
    const ten = currentStudent.ten?.trim();
    const username = currentStudent.username?.trim()?.toLowerCase();
    const password = currentStudent.password?.trim() || '123456';
    const lop = currentStudent.lop?.trim();

    if (!ten || !username || !lop) {
      alert("Thầy Thạch ơi, vui lòng nhập đủ Họ tên, Lớp và Tên đăng nhập nhé!");
      return;
    }
    
    setLoading(true);
    setStatusText('Đang kiểm tra dữ liệu...');

    try {
      const withTimeout = (promise: Promise<any>, ms: number) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Kết nối quá lâu (Timeout)')), ms))
        ]);
      };

      if (currentStudent.id) {
        setStatusText('Đang cập nhật...');
        const { error } = await withTimeout(supabase.from('hoc_sinh').update({
          ten, lop, username
        }).eq('id', currentStudent.id), 15000);

        if (error) throw error;
        alert("Cập nhật thành công!");
      } else {
        setStatusText('Kiểm tra tài khoản...');
        const { data: exists } = await withTimeout(supabase.from('nguoi_dung').select('username').eq('username', username).maybeSingle(), 5000);
        if (exists) throw new Error(`Tên đăng nhập "${username}" đã có người dùng rồi ạ!`);

        setStatusText('Bước 1: Tạo tài khoản...');
        const { data: newUser, error: userError } = await withTimeout(supabase.from('nguoi_dung').insert([
          { username, password, vai_tro: 'hocSinh' }
        ]).select(), 15000);

        if (userError) throw new Error(`Lỗi tạo tài khoản: ${userError.message}`);

        const userId = newUser?.[0]?.id;
        if (!userId) throw new Error("Không lấy được ID tài khoản mới tạo.");

        setStatusText('Bước 2: Tạo hồ sơ học sinh...');
        const { error: profileError } = await withTimeout(supabase.from('hoc_sinh').insert([
          { ten, lop, username, user_id: userId, nhan_xet: 'Chào mừng em!' }
        ]), 15000);

        if (profileError) {
          await supabase.from('nguoi_dung').delete().eq('id', userId);
          throw new Error(`Lỗi tạo hồ sơ: ${profileError.message}`);
        }
        
        alert(`Thêm thành công học sinh ${ten}!`);
      }

      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const executeDelete = async () => {
    const student = showConfirmDelete;
    if (!student) return;

    setShowConfirmDelete(null);
    setLoading(true);
    setStatusText(`Đang xóa em ${student.ten}...`);

    try {
      const { error: delProfileErr } = await supabase
        .from('hoc_sinh')
        .delete()
        .eq('id', student.id);
      
      if (delProfileErr) throw new Error("Lỗi xóa hồ sơ: " + delProfileErr.message);

      if (student.username) {
        setStatusText('Xóa tài khoản đăng nhập...');
        const { error: delUserErr } = await supabase
          .from('nguoi_dung')
          .delete()
          .eq('username', student.username);
        
        if (delUserErr) console.warn("Tài khoản chưa xóa được:", delUserErr.message);
      }

      alert(`Đã xóa sạch dữ liệu của học sinh ${student.ten}!`);
      onRefresh();
    } catch (err: any) {
      alert("Lỗi khi xóa: " + err.message);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-24 relative">
      {loading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center border-t-8 border-blue-600 max-w-sm w-full">
            <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <p className="text-blue-600 font-black text-xl mb-2">{statusText || 'Đang xử lý...'}</p>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Thầy vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-[90] flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full border-t-8 border-red-500 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl">warning</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-3">Xóa học sinh này?</h3>
            <p className="text-slate-500 font-medium mb-8">
              Thầy có chắc muốn xóa em <span className="font-black text-red-500">{showConfirmDelete.ten}</span>? 
              Dữ liệu học tập và tài khoản đăng nhập <span className="font-bold">@{showConfirmDelete.username}</span> sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmDelete(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs">Không xóa</button>
              <button onClick={executeDelete} className="flex-1 py-4 font-black bg-red-500 text-white rounded-2xl shadow-xl shadow-red-100 active:scale-95 transition-all">Đồng ý xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-1">Quản lý học sinh</h2>
          <p className="text-slate-400 text-sm font-medium">Cấp tài khoản và quản lý học sinh.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Custom Dropdown Filter matching the sample image */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-white border border-slate-100 rounded-[1.5rem] px-6 py-4 shadow-sm flex items-center gap-4 min-w-[220px] hover:shadow-md transition-all active:scale-95 group"
            >
              <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 transition-colors">filter_alt</span>
              <span className="flex-1 text-left font-bold text-slate-600">
                {filterClass ? `Lớp Nhóm Toán ${filterClass}` : 'Tất cả các lớp'}
              </span>
              <span className={`material-symbols-outlined text-slate-300 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isFilterOpen && (
              <div className="absolute top-full mt-3 left-0 w-full bg-white rounded-2xl shadow-[0_15px_50px_-10px_rgba(0,0,0,0.15)] border border-slate-50 py-2 z-[60] animate-fadeIn overflow-hidden">
                <button 
                  onClick={() => { if(onSetFilterClass) onSetFilterClass(null); setIsFilterOpen(false); }}
                  className={`w-full text-left px-6 py-3.5 text-sm font-bold transition-colors ${!filterClass ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  Tất cả các lớp
                </button>
                {allLopHoc.map(l => (
                  <button 
                    key={l.id} 
                    onClick={() => { if(onSetFilterClass) onSetFilterClass(l.tenLop); setIsFilterOpen(false); }}
                    className={`w-full text-left px-6 py-3.5 text-sm font-bold transition-colors ${filterClass === l.tenLop ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    Lớp Nhóm Toán {l.tenLop}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setCurrentStudent({ ten: '', lop: filterClass || '', username: '', password: '' });
              setIsEditing(true);
            }}
            className="bg-[#2563eb] text-white px-8 py-5 rounded-[1.5rem] font-black flex items-center gap-3 shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">person_add</span> Thêm học sinh
          </button>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl border-t-8 border-blue-600 relative overflow-hidden animate-fadeIn">
            <h3 className="text-3xl font-black mb-8 text-slate-800">
              {currentStudent.id ? 'Sửa thông tin' : 'Học sinh mới'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ tên học sinh</label>
                <input 
                  type="text" 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white font-bold text-slate-700 transition-all"
                  value={currentStudent.ten} 
                  onChange={e => setCurrentStudent({...currentStudent, ten: e.target.value})} 
                  placeholder="Ví dụ: Nguyễn Ngọc Bảo Trân"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lớp học</label>
                <select 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white font-bold text-slate-700 transition-all"
                  value={currentStudent.lop} 
                  onChange={e => setCurrentStudent({...currentStudent, lop: e.target.value})}
                >
                  <option value="">-- Chọn lớp --</option>
                  {allLopHoc.map(l => (
                    <option key={l.id} value={l.tenLop}>Lớp {l.tenLop}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                <input 
                  type="text" 
                  disabled={!!currentStudent.id}
                  className="w-full p-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-slate-700 disabled:bg-slate-100"
                  value={currentStudent.username} 
                  onChange={e => setCurrentStudent({...currentStudent, username: e.target.value.replace(/\s/g, '').toLowerCase()})}
                  placeholder="tên tài khoản"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                <input 
                  type="password" 
                  className="w-full p-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-slate-700"
                  value={currentStudent.password} 
                  placeholder="Mặc định: 123456"
                  onChange={e => setCurrentStudent({...currentStudent, password: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setIsEditing(false); if (onResetInitialClass) onResetInitialClass(); }} className="flex-1 py-5 font-black text-slate-400 uppercase text-xs">Hủy bỏ</button>
              <button onClick={handleSave} className="flex-1 py-5 font-black bg-[#2563eb] text-white rounded-3xl shadow-xl shadow-blue-100 active:scale-95 transition-all">Lưu dữ liệu</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10">
        {filteredStudents.map(st => (
          <div key={st.id} className="bg-white p-10 rounded-[3rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className="flex items-center gap-6 mb-8">
              {/* Avatar Box as per sample */}
              <div className="w-20 h-20 rounded-[1.5rem] bg-[#2563eb] text-white flex items-center justify-center text-4xl font-black shadow-[0_10px_20px_rgba(37,99,235,0.3)]">
                {st.ten?.[0] || '?' }
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[#1e293b] text-2xl tracking-tight leading-tight mb-2 group-hover:text-[#2563eb] transition-colors">{st.ten}</h3>
                <div className="flex flex-col gap-1">
                  <span className="inline-block bg-[#eff6ff] text-[#2563eb] px-3 py-1 rounded-lg text-[10px] font-black uppercase w-fit tracking-wider">
                    LỚP NHÓM TOÁN {st.lop}
                  </span>
                  <span className="text-[10px] text-slate-300 font-bold italic">@{st.username}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-auto pt-6 border-t border-slate-50">
              <button 
                onClick={() => { setCurrentStudent({...st, password: ''}); setIsEditing(true); }}
                className="flex-1 py-4 bg-[#eff6ff] text-[#2563eb] rounded-2xl text-[12px] font-black hover:bg-[#2563eb] hover:text-white transition-all uppercase tracking-widest shadow-sm"
              >
                CHỈNH SỬA
              </button>
              <button 
                onClick={() => setShowConfirmDelete(st)}
                className="w-14 h-14 bg-[#fef2f2] text-[#ef4444] rounded-2xl flex items-center justify-center hover:bg-[#ef4444] hover:text-white transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-2xl">delete</span>
              </button>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="col-span-full py-40 text-center bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-6xl text-slate-200">person_search</span>
             </div>
             <p className="font-black text-slate-300 uppercase tracking-widest text-lg">Hệ thống đang chờ học sinh...</p>
             <p className="text-xs text-slate-400 mt-2 font-medium">{filterClass ? `Lớp ${filterClass} hiện chưa có học sinh nào đăng ký.` : 'Danh sách học sinh toàn trường hiện đang trống.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudents;
