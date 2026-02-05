
import React, { useState } from 'react';
import { BaiHoc } from '../types';
import { LOGO_URL } from '../constants';

interface LessonListProps {
  lessons: BaiHoc[];
  onSelectLesson: (id: string) => void;
}

const LessonList: React.FC<LessonListProps> = ({ lessons, onSelectLesson }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openGrade, setOpenGrade] = useState<string | null>('6');
  
  const gradeConfigs: Record<string, { color: string, bg: string, border: string, icon: string, label: string }> = {
    '6': { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: 'eco', label: 'Toán 6 - Chân trời sáng tạo' },
    '7': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: 'wb_sunny', label: 'Toán 7 - Chân trời sáng tạo' },
    '8': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: 'auto_awesome', label: 'Toán 8 - Chân trời sáng tạo' },
    '9': { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', icon: 'diamond', label: 'Toán 9 - Chân trời sáng tạo' },
  };

  const toggleGrade = (grade: string) => {
    setOpenGrade(openGrade === grade ? null : grade);
  };

  const renderGradeDropdown = (grade: string) => {
    const config = gradeConfigs[grade];
    const gradeLessons = lessons.filter(l => l.lop === grade && 
      (l.tenBai.toLowerCase().includes(searchTerm.toLowerCase()) || 
       l.chuong.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (gradeLessons.length === 0 && searchTerm !== '') return null;

    const isOpen = openGrade === grade;

    return (
      <div key={grade} className={`mb-6 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${isOpen ? `${config.border} bg-white shadow-xl` : 'border-transparent bg-white shadow-sm'}`}>
        {/* Dropdown Header */}
        <button 
          onClick={() => toggleGrade(grade)}
          className={`w-full flex items-center justify-between p-8 transition-all ${isOpen ? config.bg : 'hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 ${isOpen ? 'scale-110 rotate-3' : ''} ${config.bg.replace('50', '500')}`}>
              <span className="material-symbols-outlined text-3xl">{config.icon}</span>
            </div>
            <div className="text-left">
              <h3 className={`text-2xl font-black ${config.color}`}>{config.label}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                {gradeLessons.length} bài học hiện có
              </p>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-white text-slate-800 rotate-180 shadow-md' : 'text-slate-300'}`}>
            <span className="material-symbols-outlined text-3xl">expand_more</span>
          </div>
        </button>

        {/* Dropdown Content */}
        {isOpen && (
          <div className="p-6 md:p-10 animate-fadeIn space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gradeLessons.map((lesson) => (
                <div 
                  key={lesson.id} 
                  onClick={() => onSelectLesson(lesson.id)}
                  className="group relative p-8 bg-slate-50 rounded-[2.5rem] border-2 border-transparent hover:border-blue-500 hover:bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="px-4 py-1.5 bg-white text-blue-600 text-[9px] font-black rounded-full shadow-sm border border-blue-50 uppercase tracking-widest">
                      {lesson.chuong}
                    </div>
                    <span className="material-symbols-outlined text-slate-200 group-hover:text-blue-500 transition-colors text-3xl">menu_book</span>
                  </div>
                  
                  <h4 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-tight mb-4">
                    {lesson.tenBai}
                  </h4>

                  {lesson.yeuCauCanDat && (
                    <div className="bg-white/60 p-4 rounded-2xl mb-6 group-hover:bg-blue-50 transition-colors">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                         <span className="material-symbols-outlined text-[12px]">verified</span>
                         Mục tiêu cần đạt
                       </p>
                       <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed italic">
                         {lesson.yeuCauCanDat}
                       </p>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest group-hover:text-blue-500">Khám phá ngay</span>
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-300 shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                      <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
                    </div>
                  </div>
                </div>
              ))}
              {gradeLessons.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-slate-200">folder_off</span>
                  </div>
                  <p className="text-slate-400 font-bold italic">Thầy Thạch đang cập nhật thêm bài giảng cho khối này...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-gradient-to-br from-[#2563eb] to-indigo-700 p-10 md:p-14 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        {/* Logo Watermark */}
        <div className="absolute top-4 right-4 md:right-10 md:top-10 z-0 opacity-20 rotate-12 pointer-events-none">
            <img 
                src={LOGO_URL}
                alt="" 
                className="w-48 h-48 object-contain" 
            />
        </div>

        <div className="relative z-10 space-y-3">
          <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Hệ thống Math.TQT</span>
          <h2 className="text-5xl font-black tracking-tighter">Kho báu tri thức</h2>
          <p className="text-blue-100 font-medium text-lg opacity-80">Chọn khối lớp để bắt đầu hành trình chinh phục môn Toán.</p>
        </div>
        
        <div className="relative z-10 w-full md:w-80 space-y-4">
           <div className="relative group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Tìm tên bài, chương..."
              className="w-full pl-14 pr-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] outline-none focus:bg-white focus:text-slate-800 focus:ring-4 focus:ring-blue-400/20 font-bold placeholder:text-blue-200/60 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grade Sections */}
      <div className="space-y-2">
        {['6', '7', '8', '9'].map(grade => renderGradeDropdown(grade))}
      </div>

      {/* Final Prompt */}
      <div className="py-12 text-center">
        <p className="text-slate-300 font-black text-xs uppercase tracking-[0.4em]">Học tập chủ động • Tương lai vững vàng</p>
      </div>
    </div>
  );
};

export default LessonList;
