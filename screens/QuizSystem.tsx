
import React, { useState, useEffect } from 'react';
import { AppData, BaiTap, DeKiemTra, Screen } from '../types';
import { supabase } from '../services/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface QuizSystemProps {
  data: AppData;
  onRefresh: () => void;
  userRole: 'hocSinh' | 'giaoVien';
}

const QuizSystem: React.FC<QuizSystemProps> = ({ data, onRefresh, userRole }) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'quizzes' | 'stats'>('bank');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<BaiTap>>({
    loai: 'Trắc nghiệm', deBai: '', dapAn: ['', '', '', ''], dapAnDung: '', doKho: 'Dễ', chuDe: 'Đại số', mucDo: 'Nhận biết'
  });
  const [newQuiz, setNewQuiz] = useState<Partial<DeKiemTra>>({
    tenDe: '', moTa: '', lop: '9', thoiGian: 45, cauHoiIds: []
  });

  const isTeacher = userRole === 'giaoVien';

  // Thống kê minh họa
  const statsData = [
    { name: 'Đại số', correct: 75, total: 100 },
    { name: 'Hình học', correct: 60, total: 90 },
    { name: 'Thống kê', correct: 85, total: 100 },
    { name: 'Xác suất', correct: 45, total: 80 },
  ];

  const handleSaveQuestion = async () => {
    if (!currentQuestion.deBai || !currentQuestion.dapAnDung) return alert("Vui lòng điền đủ thông tin.");
    try {
      const { error } = await supabase.from('ngan_hang_cau_hoi').insert([{
        de_bai: currentQuestion.deBai,
        loai: currentQuestion.loai,
        dap_an: currentQuestion.dapAn,
        dap_an_dung: currentQuestion.dapAnDung,
        do_kho: currentQuestion.doKho,
        chu_de: currentQuestion.chuDe,
        muc_do: currentQuestion.mucDo
      }]);
      if (error) throw error;
      alert("Đã lưu câu hỏi!");
      setIsAddingQuestion(false);
      onRefresh();
    } catch (e: any) { alert(e.message); }
  };

  const handleCreateQuiz = async () => {
    if (!newQuiz.tenDe || !newQuiz.lop) return alert("Vui lòng điền tên đề và khối lớp.");
    try {
      const { error } = await supabase.from('de_kiem_tra').insert([{
        ten_de: newQuiz.tenDe,
        mo_ta: newQuiz.moTa,
        lop: newQuiz.lop,
        thoi_gian: newQuiz.thoiGian,
        cau_hoi_ids: newQuiz.cauHoiIds
      }]);
      if (error) throw error;
      alert("Đã tạo đề thi thành công!");
      setIsCreatingQuiz(false);
      onRefresh();
    } catch (e: any) { alert(e.message); }
  };

  if (!isTeacher) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-3 tracking-tight">Thử thách Bài tập 🏁</h2>
            <p className="text-blue-100 font-medium text-lg opacity-90">Hoàn thành các bài luyện tập để nâng cao kỹ năng và tích điểm!</p>
          </div>
          <span className="material-symbols-outlined absolute -right-10 -bottom-10 text-[200px] text-white/5 rotate-12">history_edu</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.tatCaDeKiemTra.map(de => (
            <div key={de.id} className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Lớp {de.lop}</span>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs"><span className="material-symbols-outlined text-sm">schedule</span> {de.thoiGian} phút</div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-4 group-hover:text-blue-600 transition-colors">{de.tenDe}</h3>
              <p className="text-slate-500 text-sm mb-10 line-clamp-2 leading-relaxed">{de.moTa || 'Bài kiểm tra kiến thức tổng hợp.'}</p>
              <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                Bắt đầu làm bài <span className="material-symbols-outlined text-xl">play_circle</span>
              </button>
            </div>
          ))}
          {data.tatCaDeKiemTra.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white rounded-[3.5rem] border-4 border-dashed border-slate-50">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><span className="material-symbols-outlined text-4xl text-slate-200">quiz</span></div>
              <p className="text-slate-300 font-black uppercase tracking-[0.3em]">Hệ thống chưa có đề kiểm tra mới</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Quản lý Đề thi & Bài tập</h2>
          <p className="text-slate-400 font-medium">Hỗ trợ giáo viên soạn và giao bài tập tự động.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner">
          <button onClick={() => setActiveTab('bank')} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'bank' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Ngân hàng</button>
          <button onClick={() => setActiveTab('quizzes')} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'quizzes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Đề đã giao</button>
          <button onClick={() => setActiveTab('stats')} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Phân tích</button>
        </div>
      </div>

      {activeTab === 'bank' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
            <div className="flex gap-4">
               <select className="px-6 py-3.5 bg-slate-50 border-none rounded-xl font-bold text-slate-600 text-sm outline-none focus:ring-4 focus:ring-blue-100"><option>Tất cả Chủ đề</option><option>Đại số</option><option>Hình học</option></select>
               <select className="px-6 py-3.5 bg-slate-50 border-none rounded-xl font-bold text-slate-600 text-sm outline-none focus:ring-4 focus:ring-blue-100"><option>Mọi Độ khó</option><option>Dễ</option><option>Khó</option></select>
            </div>
            <button onClick={() => setIsAddingQuestion(true)} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.1em] flex items-center gap-3 shadow-xl hover:bg-blue-700 transition-all">
              <span className="material-symbols-outlined text-lg">add_circle</span> Thêm câu hỏi
            </button>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nội dung</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chủ đề / Khối</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Độ khó</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.nganHangCauHoi.map((q, i) => (
                  <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-8 py-6"><p className="font-bold text-slate-800 line-clamp-1 leading-relaxed">{q.deBai}</p><p className="text-[9px] font-black text-slate-400 uppercase mt-1">{q.loai}</p></td>
                    <td className="px-8 py-6"><p className="font-bold text-slate-600 text-xs">{q.chuDe}</p><p className="text-[9px] font-black text-blue-500 uppercase">Khối 9</p></td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${q.doKho === 'Khó' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{q.doKho}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="text-slate-300 hover:text-blue-600 transition-colors"><span className="material-symbols-outlined text-xl">edit</span></button>
                    </td>
                  </tr>
                ))}
                {data.nganHangCauHoi.length === 0 && <tr><td colSpan={4} className="py-24 text-center text-slate-300 font-bold italic">Ngân hàng câu hỏi hiện đang trống...</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-50">
            <h3 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-4">
              <span className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><span className="material-symbols-outlined">analytics</span></span>
              Tỉ lệ trả lời đúng theo Chủ đề
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#64748b'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="correct" radius={[8, 8, 0, 0]} barSize={40}>
                    {statsData.map((e, idx) => <Cell key={idx} fill={e.correct > 70 ? '#2563eb' : '#f59e0b'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-50 flex flex-col justify-center text-center">
            <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-200">
               <span className="material-symbols-outlined text-5xl">inventory</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-4">{data.nganHangCauHoi.length} Câu hỏi</h3>
            <p className="text-slate-400 font-medium max-w-xs mx-auto mb-10">Ngân hàng câu hỏi của Thầy đang phát triển rất tốt để hỗ trợ học sinh tự luyện.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 rounded-3xl"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Mức Nhận biết</p><p className="text-xl font-black text-slate-800">45%</p></div>
              <div className="bg-slate-50 p-6 rounded-3xl"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Mức Vận dụng</p><p className="text-xl font-black text-slate-800">25%</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Question */}
      {isAddingQuestion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-12 shadow-2xl border-t-8 border-blue-600 animate-fadeIn overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-800">Soạn câu hỏi mới</h3>
              <button onClick={() => setIsAddingQuestion(false)} className="text-slate-300 hover:text-slate-600"><span className="material-symbols-outlined text-4xl">close</span></button>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chủ đề</label><select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={currentQuestion.chuDe} onChange={e => setCurrentQuestion({...currentQuestion, chuDe: e.target.value})}><option>Đại số</option><option>Hình học</option><option>Xác suất</option></select></div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ khó</label><select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={currentQuestion.doKho} onChange={e => setCurrentQuestion({...currentQuestion, doKho: e.target.value as any})}><option>Dễ</option><option>Trung bình</option><option>Khó</option></select></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung đề bài</label><textarea className="w-full p-6 bg-slate-50 rounded-2xl font-bold border-none h-32 outline-none focus:ring-4 focus:ring-blue-100" value={currentQuestion.deBai} onChange={e => setCurrentQuestion({...currentQuestion, deBai: e.target.value})} placeholder="Nhập câu hỏi Toán học..." /></div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Các phương án trả lời</label>
                 {currentQuestion.dapAn?.map((ans, idx) => (
                   <div key={idx} className="flex gap-4 items-center">
                     <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">{String.fromCharCode(65 + idx)}</span>
                     <input className="flex-1 p-4 bg-slate-50 rounded-xl font-bold border-none" value={ans} onChange={e => {
                        const newAns = [...(currentQuestion.dapAn || [])];
                        newAns[idx] = e.target.value;
                        setCurrentQuestion({...currentQuestion, dapAn: newAns});
                     }} />
                   </div>
                 ))}
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đáp án đúng</label><input className="w-full p-5 bg-blue-50 text-blue-600 rounded-2xl font-black border-none" value={currentQuestion.dapAnDung} onChange={e => setCurrentQuestion({...currentQuestion, dapAnDung: e.target.value})} placeholder="Nhập chính xác đáp án đúng..." /></div>
              <button onClick={handleSaveQuestion} className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">Lưu vào ngân hàng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSystem;
