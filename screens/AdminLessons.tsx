
import React, { useState, useEffect } from 'react';
import { BaiHoc, BaiTap } from '../types';
import { supabase } from '../services/supabaseClient';
import { generateLessonContent } from '../services/geminiService';
import { SGK_CURRICULUM } from '../constants';

interface AdminLessonsProps {
  lessons: BaiHoc[];
  onRefresh: () => void;
  onOpenSmartWorksheet: (grade?: string) => void;
}

const AdminLessons: React.FC<AdminLessonsProps> = ({ lessons, onRefresh, onOpenSmartWorksheet }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [isCustomChapter, setIsCustomChapter] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Partial<BaiHoc>>({
    tenBai: '', lop: '9', chuong: '', lyThuyet: '', yeuCauCanDat: '', baiTap: []
  });
  
  // Grade Filter State
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  // Helper để lấy danh sách chương của lớp
  const getChapters = (grade: string) => {
    return SGK_CURRICULUM[grade] ? Object.keys(SGK_CURRICULUM[grade]) : [];
  };

  // Helper để lấy danh sách bài của chương
  const getLessonsInChapter = (grade: string, chapter: string) => {
    return (SGK_CURRICULUM[grade] && SGK_CURRICULUM[grade][chapter]) ? SGK_CURRICULUM[grade][chapter] : [];
  };

  useEffect(() => {
    if (!currentLesson.id && !isCustomTitle && !isCustomChapter) {
      const grade = currentLesson.lop || '9';
      const chapters = getChapters(grade);
      if (chapters.length > 0) {
        const firstChapter = chapters[0];
        const lessons = getLessonsInChapter(grade, firstChapter);
        const firstLesson = lessons[0] || '';
        
        setCurrentLesson(prev => ({ 
          ...prev, 
          chuong: firstChapter, 
          tenBai: firstLesson, 
          yeuCauCanDat: '' 
        }));
      }
    }
  }, [currentLesson.lop]);

  const handleLessonChange = (title: string) => {
    if (title === 'CUSTOM') {
      setIsCustomTitle(true);
      setCurrentLesson(prev => ({ ...prev, tenBai: '', yeuCauCanDat: '' }));
      return;
    }
    setIsCustomTitle(false);
    setCurrentLesson(prev => ({ ...prev, tenBai: title, yeuCauCanDat: '' }));
  };

  const handleAiGenerate = async () => {
    if (!currentLesson.tenBai) return alert("Thầy vui lòng chọn tên bài học.");
    setIsAiLoading(true);
    try {
      const aiData = await generateLessonContent(currentLesson.tenBai, currentLesson.lop || '9', currentLesson.yeuCauCanDat);
      setCurrentLesson(prev => ({
        ...prev,
        chuong: aiData.chuong,
        lyThuyet: aiData.lyThuyet,
        baiTap: aiData.baiTap
      }));
    } catch (e) { alert("Lỗi soạn bài AI."); }
    finally { setIsAiLoading(false); }
  };

  const handleSave = async () => {
    if (!currentLesson.tenBai || !currentLesson.chuong) return alert("Thiếu thông tin bài.");
    try {
      const payload = {
        ten_bai: currentLesson.tenBai,
        lop: currentLesson.lop,
        chuong: currentLesson.chuong,
        ly_thuyet: currentLesson.lyThuyet,
        yeu_cau_can_dat: currentLesson.yeuCauCanDat
      };
      let lessonId = currentLesson.id;
      if (lessonId) {
        await supabase.from('bai_hoc').update(payload).eq('id', lessonId);
      } else {
        const { data, error } = await supabase.from('bai_hoc').insert([payload]).select().single();
        if (error) throw error;
        lessonId = data.id;
      }
      if (lessonId && currentLesson.baiTap) {
        await supabase.from('bai_tap').delete().eq('bai_hoc_id', lessonId);
        const exercises = currentLesson.baiTap.map(bt => ({
          bai_hoc_id: lessonId, loai: bt.loai, de_bai: bt.deBai, dap_an: bt.dapAn, dap_an_dung: bt.dapAnDung
        }));
        await supabase.from('bai_tap').insert(exercises);
      }
      setIsEditing(false);
      onRefresh();
      alert("Đã lưu bài giảng thành công!");
    } catch (e: any) { alert("Lỗi lưu: " + e.message); }
  };

  const filteredLessons = lessons.filter(l => selectedGrade ? l.lop === selectedGrade : true);

  // Tính số lượng bài giảng theo khối
  const lessonCounts = ['6', '7', '8', '9'].reduce((acc, grade) => {
    acc[grade] = lessons.filter(l => l.lop === grade).length;
    return acc;
  }, {} as Record<string, number>);

  if (isEditing) {
    const grade = currentLesson.lop || '9';
    const chapters = getChapters(grade);
    const lessonsInChapter = getLessonsInChapter(grade, currentLesson.chuong || '');

    return (
      <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-20">
        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Cổng soạn bài Math.TQT</h2>
          <button onClick={() => setIsEditing(false)} className="w-12 h-12 bg-white border rounded-xl flex items-center justify-center text-slate-400"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-50 space-y-10 relative">
          {isAiLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-black text-blue-600">AI đang soạn bài dựa trên Yêu cầu cần đạt...</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Khối lớp</label>
              <select className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all" value={currentLesson.lop} onChange={e => setCurrentLesson({...currentLesson, lop: e.target.value})}>
                <option value="6">Toán lớp 6</option><option value="7">Toán lớp 7</option><option value="8">Toán lớp 8</option><option value="9">Toán lớp 9</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Chương học (Sách CTST)</label>
              <select className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all" value={currentLesson.chuong} onChange={e => setCurrentLesson({...currentLesson, chuong: e.target.value})}>
                {chapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Tên bài học</label>
              {!isCustomTitle ? (
                <select className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all" value={currentLesson.tenBai} onChange={e => handleLessonChange(e.target.value)}>
                  {lessonsInChapter.map(title => <option key={title} value={title}>{title}</option>)}
                  <option value="CUSTOM">-- Tên bài khác... --</option>
                </select>
              ) : (
                <input type="text" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700" value={currentLesson.tenBai} onChange={e => setCurrentLesson({...currentLesson, tenBai: e.target.value})} placeholder="Nhập tên bài học mới..." />
              )}
            </div>
          </div>

          <div className="bg-[#f0f7ff] p-8 rounded-[2.5rem] border border-blue-50 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Yêu cầu cần đạt
              </label>
              <button onClick={handleAiGenerate} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span> Soạn bài AI
              </button>
            </div>
            <textarea className="w-full p-6 bg-white border border-blue-100 rounded-2xl h-32 outline-none font-medium text-slate-600 text-sm leading-relaxed" placeholder="Nhập yêu cầu cần đạt để AI soạn bài chính xác hơn..." value={currentLesson.yeuCauCanDat} onChange={e => setCurrentLesson({...currentLesson, yeuCauCanDat: e.target.value})} />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung chi tiết</label>
            <textarea className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] h-96 outline-none font-medium text-slate-700 text-sm leading-relaxed" placeholder="Lý thuyết và ví dụ..." value={currentLesson.lyThuyet} onChange={e => setCurrentLesson({...currentLesson, lyThuyet: e.target.value})} />
          </div>

          <div className="pt-8 flex gap-4 border-t border-slate-50">
            <button onClick={() => setIsEditing(false)} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest">Hủy</button>
            <button onClick={handleSave} className="flex-[2] py-5 bg-[#2563eb] text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transition-all">Lưu bài giảng</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Kho bài giảng chuẩn</h2>
          <p className="text-slate-400 font-medium">Quản lý nội dung học tập lớp 6-9.</p>
        </div>
        <div className="flex gap-3">
          <button 
             onClick={() => onOpenSmartWorksheet(selectedGrade || undefined)}
             className="bg-teal-400 text-teal-900 px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-teal-300 transition-all uppercase text-xs tracking-widest"
           >
             <span className="material-symbols-outlined">auto_awesome</span>
             Tạo phiếu AI
           </button>
          <button 
             onClick={() => { 
                setCurrentLesson({ 
                   tenBai: '', 
                   lop: selectedGrade || '9', // Mặc định chọn khối lớp đang lọc
                   chuong: '', 
                   lyThuyet: '', 
                   yeuCauCanDat: '', 
                   baiTap: [] 
                }); 
                setIsEditing(true); 
             }} 
             className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-blue-700 transition-all"
           >
            <span className="material-symbols-outlined">post_add</span> Soạn bài mới
          </button>
        </div>
      </div>

      {/* Grade Filter Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['6', '7', '8', '9'].map((grade) => (
          <button
            key={grade}
            onClick={() => setSelectedGrade(selectedGrade === grade ? null : grade)}
            className={`
              relative p-6 rounded-[2rem] border-2 transition-all duration-300 text-left group overflow-hidden
              ${selectedGrade === grade 
                ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-105' 
                : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:shadow-lg'}
            `}
          >
            <div className={`absolute -right-4 -bottom-4 text-[80px] font-black opacity-10 pointer-events-none ${selectedGrade === grade ? 'text-white' : 'text-slate-300'}`}>
              {grade}
            </div>
            <div className="relative z-10">
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedGrade === grade ? 'text-blue-200' : 'text-slate-400'}`}>
                Khối Lớp
              </p>
              <h3 className="text-4xl font-black">{grade}</h3>
              <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold ${selectedGrade === grade ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500'}`}>
                <span className="material-symbols-outlined text-sm">library_books</span>
                {lessonCounts[grade]} bài
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLessons.map(l => (
          <div key={l.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Lớp {l.lop}</span>
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 line-clamp-1">{l.chuong}</p>
            <h3 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors mb-6 min-h-[3.5rem] leading-tight">{l.tenBai}</h3>
            <div className="flex gap-2 pt-6 border-t border-slate-50">
              <button onClick={() => { setCurrentLesson(l); setIsEditing(true); }} className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Sửa</button>
              <button onClick={async () => { if(confirm("Xóa bài này?")) { await supabase.from('bai_hoc').delete().eq('id', l.id); onRefresh(); } }} className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                <span className="material-symbols-outlined">delete_sweep</span>
              </button>
            </div>
          </div>
        ))}

        {filteredLessons.length === 0 && (
          <div className="col-span-full py-24 text-center flex flex-col items-center justify-center bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-slate-300">folder_off</span>
             </div>
             <p className="font-black text-slate-300 uppercase tracking-widest text-lg">
               {selectedGrade ? `Chưa có bài giảng cho Lớp ${selectedGrade}` : 'Chưa có bài giảng nào'}
             </p>
             <button onClick={() => setIsEditing(true)} className="mt-6 text-blue-600 font-bold hover:underline">Soạn bài mới ngay &rarr;</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLessons;
