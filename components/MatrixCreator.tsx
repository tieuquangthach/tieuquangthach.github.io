
import React, { useMemo, useState } from 'react';
import { MatrixRow, QUESTION_TYPES, COGNITIVE_LEVELS_DOC, QuestionType, CognitiveLevelDoc, QUESTION_TYPE_POINTS, LevelCountsDoc } from '../types';
import { subjectContentData, KnowledgeUnit } from '../data/mathContent';
import { MathText } from './QuizDisplay';

interface MatrixCreatorProps {
  matrix: MatrixRow[];
  setMatrix: React.Dispatch<React.SetStateAction<MatrixRow[]>>;
  onSubmit: () => void;
  isLoading: boolean;
  selectedClass: string;
  onClassChange: (value: string) => void;
  selectedSubject: string;
  onSubjectChange: (value: string) => void;
  hasGeneratedQuiz?: boolean;
  onReturnToQuiz?: () => void;
}

const MatrixCreator: React.FC<MatrixCreatorProps> = ({ matrix, setMatrix, onSubmit, isLoading, selectedClass, onClassChange, selectedSubject, onSubjectChange, hasGeneratedQuiz, onReturnToQuiz }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [modalData, setModalData] = useState({
    topic: '',
    knowledgeUnit: '',
    learningOutcome: '',
    qType: QUESTION_TYPES[0] as QuestionType,
    level: COGNITIVE_LEVELS_DOC[0] as CognitiveLevelDoc,
    count: 1
  });

  const topicsForClass = subjectContentData[selectedSubject]?.[selectedClass] || [];

  const handleOpenModal = () => setIsModalOpen(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalData({
      topic: '',
      knowledgeUnit: '',
      learningOutcome: '',
      qType: QUESTION_TYPES[0],
      level: COGNITIVE_LEVELS_DOC[0],
      count: 1
    });
  };

  const handleSaveModal = () => {
    if (!modalData.topic || !modalData.knowledgeUnit) return;
    const existingRowIndex = matrix.findIndex(r => r.topic === modalData.topic && r.knowledgeUnit === modalData.knowledgeUnit);
    
    if (existingRowIndex > -1) {
      const newMatrix = [...matrix];
      const updatedRow = { ...newMatrix[existingRowIndex] };
      const newCounts = JSON.parse(JSON.stringify(updatedRow.counts));
      newCounts[modalData.qType][modalData.level] = (newCounts[modalData.qType][modalData.level] || 0) + modalData.count;
      updatedRow.counts = newCounts;
      if (!updatedRow.learningOutcome) updatedRow.learningOutcome = modalData.learningOutcome;
      
      let rowPoints = 0;
      for (const type of QUESTION_TYPES) {
        const typeTotalInRow = COGNITIVE_LEVELS_DOC.reduce((sum: number, lvl) => sum + (Number(updatedRow.counts[type][lvl]) || 0), 0);
        rowPoints += typeTotalInRow * QUESTION_TYPE_POINTS[type];
      }
      updatedRow.percentage = parseFloat((rowPoints * 10).toFixed(2));
      newMatrix[existingRowIndex] = updatedRow;
      setMatrix(newMatrix);
    } else {
      const newRow: MatrixRow = {
        id: new Date().toISOString() + Math.random(),
        topic: modalData.topic,
        knowledgeUnit: modalData.knowledgeUnit,
        learningOutcome: modalData.learningOutcome,
        percentage: 0,
        counts: QUESTION_TYPES.reduce((acc, type) => {
          acc[type] = COGNITIVE_LEVELS_DOC.reduce((levelAcc, level) => {
            levelAcc[level] = type === modalData.qType && level === modalData.level ? modalData.count : 0;
            return levelAcc;
          }, {} as any);
          return acc;
        }, {} as any),
      };
      let rowPoints = modalData.count * QUESTION_TYPE_POINTS[modalData.qType];
      newRow.percentage = parseFloat((rowPoints * 10).toFixed(2));
      setMatrix([...matrix, newRow]);
    }
    handleCloseModal();
  };

  const handleRemoveRow = (id: string) => {
    setMatrix(matrix.filter(row => row.id !== id));
  };
  
  const handleCountChange = (id: string, qType: QuestionType, level: CognitiveLevelDoc, value: number) => {
    const rowToUpdate = matrix.find(r => r.id === id);
    if (!rowToUpdate) return;
    const newCounts = JSON.parse(JSON.stringify(rowToUpdate.counts)) as Record<QuestionType, LevelCountsDoc>;
    newCounts[qType][level] = value;
    
    setMatrix(currentMatrix =>
      currentMatrix.map(row => {
        if (row.id !== id) return row;
        const updatedRow = { ...row, counts: newCounts };
        let rowPoints = 0;
        for (const type of QUESTION_TYPES) {
          const typeTotalInRow = COGNITIVE_LEVELS_DOC.reduce((sum: number, lvl) => sum + (Number((updatedRow.counts as any)[type][lvl]) || 0), 0);
          rowPoints += typeTotalInRow * QUESTION_TYPE_POINTS[type];
        }
        updatedRow.percentage = parseFloat((rowPoints * 10).toFixed(2));
        return updatedRow;
      })
    );
  };

  const getOutcomeOptions = (topicName: string, unitName: string) => {
    const topic = topicsForClass.find(t => t.name === topicName);
    const unit = topic?.knowledgeUnits.find(ku => (typeof ku === 'string' ? ku : ku.unit) === unitName);
    if (!unit) return [];
    if (typeof unit === 'string') return [unit];
    
    if (Array.isArray(unit.learningOutcome)) {
      return unit.learningOutcome;
    }
    return (unit.learningOutcome as string).split('. ').filter(s => s.trim().length > 0).map(s => s.endsWith('.') ? s : s + '.');
  };

  const columnTotals = useMemo(() => {
    const totals = QUESTION_TYPES.reduce((acc, qType) => {
        acc[qType] = COGNITIVE_LEVELS_DOC.reduce((levelAcc, level) => { levelAcc[level] = 0; return levelAcc; }, {} as Record<CognitiveLevelDoc, number>);
        return acc;
    }, {} as Record<QuestionType, Record<CognitiveLevelDoc, number>>);
    matrix.forEach(row => {
        QUESTION_TYPES.forEach(qType => {
            COGNITIVE_LEVELS_DOC.forEach(level => { totals[qType][level] += (Number(row.counts[qType][level]) || 0); });
        });
    });
    return totals;
  }, [matrix]);

  const grandTotalPointsByLevel = useMemo(() => {
      const totals = {} as Record<CognitiveLevelDoc, number>;
      COGNITIVE_LEVELS_DOC.forEach(level => {
        totals[level] = QUESTION_TYPES.reduce((sum: number, qType) => sum + (columnTotals[qType][level] * QUESTION_TYPE_POINTS[qType]), 0);
      });
      return totals;
  }, [columnTotals]);

  const totalPoints = useMemo(() => Object.values(grandTotalPointsByLevel).reduce((a: number, b: number) => a + b, 0), [grandTotalPointsByLevel]);

  const isSubmittable = useMemo(() => {
    let totalQuestionsCount = 0;
    for (const qType of QUESTION_TYPES) {
      for (const level of COGNITIVE_LEVELS_DOC) {
        totalQuestionsCount += (columnTotals[qType][level] || 0);
      }
    }
    return matrix.length > 0 && totalQuestionsCount > 0;
  }, [matrix, columnTotals]);

  const modalOutcomeOptions = useMemo(() => getOutcomeOptions(modalData.topic, modalData.knowledgeUnit), [modalData.topic, modalData.knowledgeUnit]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* MODAL THÊM NỘI DUNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 flex justify-between items-center shrink-0">
               <h3 className="text-2xl font-black text-gray-800">Thêm nội dung vào ma trận</h3>
               <button onClick={handleCloseModal} className="text-gray-300 hover:text-gray-500 transition">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <div className="px-10 pb-8 space-y-6 overflow-y-auto custom-scrollbar">
               <div className="space-y-3">
                 <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Chủ đề</label>
                 <select 
                   className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition text-sm font-bold text-gray-700 shadow-sm appearance-none cursor-pointer" 
                   value={modalData.topic} 
                   onChange={(e) => setModalData({...modalData, topic: e.target.value, knowledgeUnit: '', learningOutcome: ''})}
                 >
                   <option value="">Chọn chủ đề...</option>
                   {topicsForClass.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                 </select>
               </div>
               
               <div className="space-y-3">
                 <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Nội dung kiến thức</label>
                 <select 
                   className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition text-sm font-bold text-gray-700 shadow-sm disabled:bg-gray-50 disabled:text-gray-400 appearance-none cursor-pointer" 
                   disabled={!modalData.topic} 
                   value={modalData.knowledgeUnit} 
                   onChange={(e) => {
                      const unit = e.target.value;
                      setModalData({...modalData, knowledgeUnit: unit, learningOutcome: ''});
                    }}
                 >
                   <option value="">Chọn nội dung...</option>
                   {topicsForClass.find(t => t.name === modalData.topic)?.knowledgeUnits.map(ku => {
                     const name = typeof ku === 'string' ? ku : ku.unit;
                     return <option key={name} value={name}>{name}</option>
                   })}
                 </select>
               </div>

               <div className="space-y-3">
                 <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Yêu cầu cần đạt</label>
                 <select 
                   className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition text-sm font-bold text-gray-700 shadow-sm disabled:bg-gray-50 disabled:text-gray-400 appearance-none cursor-pointer" 
                   disabled={!modalData.knowledgeUnit || modalOutcomeOptions.length === 0}
                   value={modalData.learningOutcome}
                   onChange={(e) => setModalData({...modalData, learningOutcome: e.target.value})}
                 >
                   <option value="">Chọn yêu cầu cần đạt...</option>
                   {modalOutcomeOptions.map((opt, i) => (
                      <option key={i} value={opt}>{opt.length > 80 ? opt.substring(0, 80) + '...' : opt}</option>
                   ))}
                 </select>
                 {modalData.learningOutcome && (
                   <div className="mt-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed italic">
                     <MathText text={modalData.learningOutcome} />
                   </div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Loại câu hỏi</label>
                    <select className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition text-sm font-bold text-gray-700 shadow-sm" value={modalData.qType} onChange={(e) => setModalData({...modalData, qType: e.target.value as QuestionType})}>
                      {QUESTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Mức độ</label>
                    <select className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition text-sm font-bold text-gray-700 shadow-sm" value={modalData.level} onChange={(e) => setModalData({...modalData, level: e.target.value as CognitiveLevelDoc})}>
                      {COGNITIVE_LEVELS_DOC.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Số câu</label>
                    <input type="number" min="1" className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition text-base font-black text-primary shadow-sm" value={modalData.count} onChange={(e) => setModalData({...modalData, count: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Điểm/câu</label>
                    <div className="w-full px-5 py-4 bg-blue-50 text-primary font-black rounded-2xl border border-blue-100 flex items-center justify-center text-lg">{QUESTION_TYPE_POINTS[modalData.qType].toFixed(2)}đ</div>
                  </div>
               </div>
            </div>

            <div className="px-10 py-8 bg-gray-50/50 flex gap-6 shrink-0">
               <button onClick={handleCloseModal} className="flex-1 py-4 px-6 bg-white border-2 border-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-100 transition shadow-sm text-sm uppercase tracking-wider">Hủy bỏ</button>
               <button onClick={handleSaveModal} disabled={!modalData.topic || !modalData.knowledgeUnit || modalData.count < 1 || !modalData.learningOutcome} className="flex-1 py-4 px-6 bg-primary text-white font-black rounded-2xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xl shadow-primary/20 text-sm uppercase tracking-wider">Thêm vào bảng</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-100 pb-4">
        <h2 className="text-3xl font-black text-primary tracking-tight uppercase">Thiết kế ma trận, đặc tả</h2>
      </div>

      <div className="rounded-[2rem] border border-gray-200 overflow-hidden shadow-2xl shadow-blue-900/5 bg-white">
        <div className="overflow-x-auto custom-scrollbar-h">
          <table className="w-full bold-grid bg-white text-center align-middle">
            <thead>
              <tr className="bg-primary text-white">
                <th rowSpan={3} className="px-1 py-6 text-[11px] font-black uppercase w-12">TT</th>
                <th rowSpan={3} className="px-3 py-6 text-[11px] font-black uppercase w-[240px] text-center">Chủ đề/Chương</th>
                <th rowSpan={3} className="px-3 py-6 text-[11px] font-black uppercase w-[240px] text-center">Nội dung kiến thức</th>
                <th rowSpan={3} className="px-3 py-6 text-[11px] font-black uppercase w-[360px] text-center">Yêu cầu cần đạt</th>
                <th colSpan={12} className="px-2 py-4 text-[11px] font-black uppercase tracking-tighter">Mức độ đánh giá</th>
                <th rowSpan={3} className="px-2 py-6 text-[11px] font-black uppercase w-20">Tổng</th>
                <th rowSpan={3} className="px-2 py-6 text-[11px] font-black uppercase w-20">Tỷ lệ %</th>
                <th rowSpan={3} className="px-2 py-6 text-[11px] font-black uppercase w-12">Gỡ</th>
              </tr>
              <tr className="bg-primary/95 text-white">
                <th colSpan={9} className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest">TNKQ</th>
                <th colSpan={3} className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest">Tự luận</th>
              </tr>
              <tr className="bg-primary/90 text-white text-[9px] uppercase">
                <th colSpan={3} className="py-2">Nhiều lựa chọn</th>
                <th colSpan={3} className="py-2">"Đúng - Sai"</th>
                <th colSpan={3} className="py-2">Trả lời ngắn</th>
                <th colSpan={3} className="py-2">Tự luận</th>
              </tr>
              <tr className="bg-gray-50 text-gray-500 text-[8px] uppercase font-black">
                 <th colSpan={4} className="border-none"></th>
                 {QUESTION_TYPES.map(qType => COGNITIVE_LEVELS_DOC.map(level => (
                   <th key={`${qType}-${level}-sub`} className="px-1 py-3 font-black min-w-[36px]">{level}</th>
                 )))}
                 <th colSpan={3} className="border-none"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {matrix.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-32 text-gray-300 italic text-sm text-center">
                    Chưa có nội dung nào trong ma trận. Hãy nhấn "Thêm mới" để bắt đầu thiết kế.
                  </td>
                </tr>
              ) : (
                matrix.map((row, index) => {
                  const rowTotalPoints = QUESTION_TYPES.reduce((sum: number, qType) => sum + COGNITIVE_LEVELS_DOC.reduce((lsum: number, level) => lsum + ((Number(row.counts[qType][level]) || 0) * QUESTION_TYPE_POINTS[qType]), 0), 0);
                  return (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-1 py-5 text-center text-xs font-bold text-gray-400">{index + 1}</td>
                      <td className="px-3 py-5 text-xs font-bold text-slate-700 text-left leading-snug">
                        {row.topic}
                      </td>
                      <td className="px-3 py-5 text-[11px] text-gray-600 text-left leading-relaxed">
                        {row.knowledgeUnit}
                      </td>
                      <td className="px-3 py-5 text-[11px] text-gray-600 text-left leading-relaxed italic opacity-80">
                        <MathText text={row.learningOutcome || ''} />
                      </td>
                      {QUESTION_TYPES.map(qType => 
                        COGNITIVE_LEVELS_DOC.map(level => {
                          const count = Number(row.counts[qType][level]) || 0;
                          return (
                            <td key={`${qType}-${level}`} className={`px-0 py-0 text-center ${count > 0 ? 'bg-primary/5' : ''}`}>
                              <input type="number" min="0" className="w-full h-full bg-transparent text-center text-xs py-5 outline-none font-black text-primary focus:bg-primary/10 transition" value={count || ''} onChange={(e) => handleCountChange(row.id, qType, level, parseInt(e.target.value) || 0)} />
                            </td>
                          );
                        })
                      )}
                      <td className="px-1 py-5 text-center font-black text-primary text-xs bg-gray-50/50">
                        {rowTotalPoints > 0 ? rowTotalPoints.toFixed(2) : ''}
                      </td>
                      <td className="px-1 py-5 text-center font-bold text-gray-400 text-[10px]">
                        {row.percentage > 0 ? `${row.percentage}%` : ''}
                      </td>
                      <td className="px-1 py-5 text-center">
                        <button onClick={() => handleRemoveRow(row.id)} className="text-gray-300 hover:text-red-500 transition-all p-2 rounded-full hover:bg-red-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1-1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-10">
        <div className="text-gray-400 text-sm font-bold flex items-center gap-2">
           <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" /></svg>
           Nhập số lượng câu hỏi trực tiếp vào bảng hoặc nhấn "Thêm mới"
        </div>
        <div className="flex gap-4">
          <button onClick={handleOpenModal} className="px-10 py-4 bg-white border-2 border-primary text-primary font-black rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/5 flex items-center gap-2 group text-sm uppercase tracking-widest">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Thêm mới nội dung
          </button>
        </div>
      </div>

      <button 
        onClick={onSubmit}
        disabled={!isSubmittable || isLoading}
        className={`w-full mt-10 bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-7 rounded-[2.5rem] shadow-2xl transition-all flex items-center justify-center gap-5 text-xl uppercase tracking-[0.15em] group shimmer-btn ${isSubmittable && !isLoading ? 'animate-float' : ''}`}
      >
        {isLoading ? (
          <>
            <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang tạo đề kiểm tra...
          </>
        ) : (
          <>
            <svg className="w-8 h-8 transition-transform group-hover:scale-125 group-hover:rotate-12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 10V3L4 14H11V21L20 10H13Z" />
            </svg>
            Tạo Đề Kiểm Tra
            <svg className="w-7 h-7 transform transition-transform group-hover:translate-x-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
};

export default MatrixCreator;
