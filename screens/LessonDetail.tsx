
import React, { useState } from 'react';
import { BaiHoc, BaiTap } from '../types';

interface LessonDetailProps {
  lesson: BaiHoc;
}

const LessonDetail: React.FC<LessonDetailProps> = ({ lesson }) => {
  const [activeTab, setActiveTab] = useState<'theory' | 'quiz'>('theory');
  const [quizResults, setQuizResults] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

  const handleQuizSubmit = (quizId: string, answer: string) => {
    setQuizResults(prev => ({ ...prev, [quizId]: answer }));
    setShowFeedback(prev => ({ ...prev, [quizId]: true }));
  };

  const trắcNghiệm = lesson.baiTap.filter(b => b.loai === 'Trắc nghiệm');
  const tựLuận = lesson.baiTap.filter(b => b.loai === 'Tự luận');

  return (
    <div className="animate-fadeIn">
      <div className="mb-8 flex items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">{lesson.chuong}</p>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{lesson.tenBai}</h2>
        </div>
        <div className="text-right">
          <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase shadow-lg shadow-blue-100">Khối {lesson.lop}</span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 border border-slate-50 overflow-hidden min-h-[600px] flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-50 bg-slate-50/30">
          <button 
            onClick={() => setActiveTab('theory')}
            className={`flex-1 py-6 font-black text-xs uppercase tracking-widest transition-all border-b-4 flex items-center justify-center gap-3 ${activeTab === 'theory' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <span className="material-symbols-outlined text-[20px]">local_library</span>
            Bài giảng lý thuyết
          </button>
          <button 
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 py-6 font-black text-xs uppercase tracking-widest transition-all border-b-4 flex items-center justify-center gap-3 ${activeTab === 'quiz' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <span className="material-symbols-outlined text-[20px]">psychology</span>
            Luyện tập & Kiểm tra
          </button>
        </div>

        <div className="p-8 md:p-12 flex-1">
          {activeTab === 'theory' ? (
            <div className="max-w-4xl mx-auto space-y-10">
              {/* Requirements box from PDF data */}
              {lesson.yeuCauCanDat && (
                <div className="p-8 bg-blue-50/50 rounded-[2rem] border-2 border-dashed border-blue-200 relative overflow-hidden group">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Mục tiêu em cần đạt:
                  </h4>
                  <div className="text-blue-900/70 text-sm font-medium leading-relaxed whitespace-pre-line italic">
                    {lesson.yeuCauCanDat}
                  </div>
                </div>
              )}

              <div className="prose prose-slate max-w-none">
                <div className="text-slate-700 text-base leading-[1.8] whitespace-pre-line font-medium">
                  {lesson.lyThuyet}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-12">
              {/* Trắc nghiệm */}
              {trắcNghiệm.length > 0 ? (
                <div className="space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                      <span className="material-symbols-outlined">quiz</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800">Thử thách trắc nghiệm</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hoàn thành để nhận điểm thi đua</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {trắcNghiệm.map((bt, idx) => (
                      <div key={bt.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                        <p className="font-black text-slate-800 text-lg mb-6 leading-snug">Câu {idx + 1}: {bt.deBai}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {bt.dapAn?.map((opt) => (
                            <button 
                              key={opt}
                              onClick={() => handleQuizSubmit(bt.id || String(idx), opt)}
                              className={`
                                p-5 rounded-[1.5rem] text-left transition-all border-2 font-bold text-sm
                                ${quizResults[bt.id || String(idx)] === opt 
                                  ? (opt === bt.dapAnDung ? 'border-green-500 bg-green-50 text-green-800' : 'border-red-500 bg-red-50 text-red-800')
                                  : 'border-white bg-white hover:border-blue-100 shadow-sm'}
                              `}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {showFeedback[bt.id || String(idx)] && (
                          <div className={`mt-6 p-4 rounded-2xl text-sm font-black flex items-center gap-3 animate-fadeIn ${quizResults[bt.id || String(idx)] === bt.dapAnDung ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <span className="material-symbols-outlined">{quizResults[bt.id || String(idx)] === bt.dapAnDung ? 'check_circle' : 'error'}</span>
                            {quizResults[bt.id || String(idx)] === bt.dapAnDung 
                              ? 'Tuyệt vời! Câu trả lời hoàn toàn chính xác.' 
                              : `Hơi tiếc một chút! Đáp án đúng là: ${bt.dapAnDung}.`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined text-4xl text-slate-200">assignment_late</span>
                   </div>
                   <p className="text-slate-400 font-black uppercase tracking-widest">Chưa có bài tập cho bài học này</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
