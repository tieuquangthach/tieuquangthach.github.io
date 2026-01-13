

import React from 'react';

interface GeneralInfoFormProps {
  subject: string;
  grade: string;
  title: string;
  duration: string;
  onSubjectChange: (val: string) => void;
  onGradeChange: (val: string) => void;
  onTitleChange: (val: string) => void;
  onDurationChange: (val: string) => void;
  onNext: () => void;
}

const TEST_NAME_OPTIONS = [
  "Kiểm tra giữa kỳ I",
  "Kiểm tra cuối kỳ I",
  "Kiểm tra giữa kỳ II",
  "Kiểm tra cuối kỳ II"
];

const SUBJECT_OPTIONS = ["Toán", "Tin"];
const GRADE_OPTIONS = ["6", "7", "8", "9"];

const GeneralInfoForm: React.FC<GeneralInfoFormProps> = ({
  subject,
  grade,
  title,
  duration,
  onSubjectChange,
  onGradeChange,
  onTitleChange,
  onDurationChange,
  onNext
}) => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-[0_10px_50px_rgba(0,0,0,0.04)] border border-gray-50 p-10 md:p-14 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-2xl">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Thông tin chung đề kiểm tra</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Môn học</label>
            <select 
              value={subject} 
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition text-base font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
            >
              {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Khối lớp</label>
            <select 
              value={grade} 
              onChange={(e) => onGradeChange(e.target.value)}
              className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition text-base font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
            >
              {GRADE_OPTIONS.map(g => <option key={g} value={g}>Lớp {g}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên bài kiểm tra</label>
          <select 
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition text-base font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
          >
            <option value="">Chọn tên bài kiểm tra...</option>
            {TEST_NAME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Thời gian làm bài (Phút)</label>
          <input 
            type="text" 
            placeholder="90" 
            value={duration}
            onChange={(e) => onDurationChange(e.target.value)}
            className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition text-base font-bold text-slate-700 shadow-sm"
          />
        </div>
      </div>

      <button 
        onClick={onNext}
        disabled={!title || !duration}
        className="w-full mt-10 bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-4 text-xl uppercase tracking-widest group"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Xây dựng ma trận, đặc tả
        <svg className="w-6 h-6 transform transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default GeneralInfoForm;
