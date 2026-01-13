import React, { useMemo, useState } from 'react';
import { QuizSpecification, QuizMatrix, MatrixRow, QUESTION_TYPES, COGNITIVE_LEVELS_DOC, QuestionType, CognitiveLevelDoc } from '../types';
import { MathText } from './QuizDisplay';

interface SpecificationDisplayProps {
  specification: QuizSpecification;
  matrix: QuizMatrix;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

interface GroupedSpec {
  [key: string]: { // chuDe
    [key: string]: { // noiDung
      [key: string]: { // yeuCauCanDat
        [key in QuestionType]?: {
          [key in CognitiveLevelDoc]?: number
        }
      }
    }
  }
}

const SpecificationDisplay: React.FC<SpecificationDisplayProps> = ({ specification, matrix, onBack, onSubmit, isLoading }) => {
  const [copyButtonText, setCopyButtonText] = useState('Sao chép Markdown');
  
  const groupedSpecification = useMemo(() => {
    const grouped: GroupedSpec = {};
    specification.forEach(item => {
      if (!grouped[item.chuDe]) grouped[item.chuDe] = {};
      if (!grouped[item.chuDe][item.noiDung]) grouped[item.chuDe][item.noiDung] = {};
      if (!grouped[item.chuDe][item.noiDung][item.yeuCauCanDat]) grouped[item.chuDe][item.noiDung][item.yeuCauCanDat] = {};
      if (!grouped[item.chuDe][item.noiDung][item.yeuCauCanDat][item.loaiCauHoi]) grouped[item.chuDe][item.noiDung][item.yeuCauCanDat][item.loaiCauHoi] = {};
      grouped[item.chuDe][item.noiDung][item.yeuCauCanDat][item.loaiCauHoi]![item.mucDo] = item.soLuong;
    });
    return grouped;
  }, [specification]);

  const columnTotals = useMemo(() => {
    const totals = QUESTION_TYPES.reduce((acc, qType) => {
        acc[qType] = COGNITIVE_LEVELS_DOC.reduce((levelAcc, level) => {
            levelAcc[level] = 0;
            return levelAcc;
        }, {} as Record<CognitiveLevelDoc, number>);
        return acc;
    }, {} as Record<QuestionType, Record<CognitiveLevelDoc, number>>);

    specification.forEach(item => {
        if (totals[item.loaiCauHoi]?.[item.mucDo] !== undefined) {
            totals[item.loaiCauHoi][item.mucDo] += (Number(item.soLuong) || 0);
        }
    });
    return totals;
  }, [specification]);

  const grandTotal = useMemo(() => specification.reduce((sum, item) => sum + (Number(item.soLuong) || 0), 0), [specification]);

  const handleExportExcel = () => {
    if (specification.length === 0) return;
    
    let csv = "Chủ đề,Nội dung kiến thức,Yêu cầu cần đạt,";
    QUESTION_TYPES.forEach(qType => {
      COGNITIVE_LEVELS_DOC.forEach(level => {
        csv += `${qType} - ${level},`;
      });
    });
    csv += "Tổng\n";

    Object.entries(groupedSpecification).forEach(([chuDe, noiDungGroup]) => {
      Object.entries(noiDungGroup).forEach(([noiDung, yeuCauGroup]) => {
        Object.entries(yeuCauGroup).forEach(([yeuCau, countGroup]) => {
          const rowTotal = Object.values(countGroup)
            .flatMap(levelCounts => levelCounts ? Object.values(levelCounts) : [])
            .reduce((sum: number, count) => sum + Number(count || 0), 0);

          csv += `"${chuDe}","${noiDung}","${yeuCau}",`;
          QUESTION_TYPES.forEach(qType => {
            COGNITIVE_LEVELS_DOC.forEach(level => {
              csv += `${countGroup[qType]?.[level] || 0},`;
            });
          });
          csv += `${rowTotal}\n`;
        });
      });
    });

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Bang_Dac_Ta_De_Kiem_Tra.csv`;
    link.click();
  };

  return (
    <div className="bg-surface p-6 rounded-xl shadow-lg border border-border space-y-6">
      <h2 className="text-2xl font-bold text-primary text-center">Bước 2: Bảng Đặc Tả Chi Tiết</h2>
      <div className="overflow-x-auto rounded-lg border border-border shadow-inner">
        <table className="min-w-full divide-y divide-border text-[10px] border-collapse">
           <thead className="bg-primary/10 text-center align-middle">
            <tr>
              <th rowSpan={3} className="px-2 py-3 font-bold text-primary uppercase border border-border">Chủ đề</th>
              <th rowSpan={3} className="px-2 py-3 font-bold text-primary uppercase border border-border" style={{minWidth: '150px'}}>Nội dung</th>
              <th rowSpan={3} className="px-2 py-3 font-bold text-primary uppercase border border-border" style={{minWidth: '300px'}}>Yêu cầu cần đạt</th>
              <th colSpan={12} className="px-2 py-2 font-bold text-primary uppercase border border-border">Mức độ đánh giá</th>
              <th rowSpan={3} className="px-2 py-3 font-bold text-primary uppercase border border-border">Tổng</th>
            </tr>
            <tr>
              {QUESTION_TYPES.map(type => (<th key={type} colSpan={3} className="px-1 py-2 font-bold text-primary border border-border uppercase">{type}</th>))}
            </tr>
            <tr>
              {QUESTION_TYPES.map(qType => COGNITIVE_LEVELS_DOC.map(level => (<th key={`${qType}-${level}`} className="px-1 py-1 font-bold text-primary border border-border uppercase">{level}</th>)))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border">
            {Object.entries(groupedSpecification).map(([chuDe, noiDungGroup]) => {
              const chuDeRowSpan = Object.values(noiDungGroup).reduce((sum, yeuCauGroup) => sum + Object.keys(yeuCauGroup).length, 0);
              let isFirstOfChuDe = true;

              return Object.entries(noiDungGroup).map(([noiDung, yeuCauGroup]) => {
                const noiDungRowSpan = Object.keys(yeuCauGroup).length;
                let isFirstOfNoiDung = true;

                return Object.entries(yeuCauGroup).map(([yeuCau, countGroup]) => {
                  const rowTotal = Object.values(countGroup)
                    .flatMap(levelCounts => levelCounts ? Object.values(levelCounts) : [])
                    .reduce((sum: number, count) => sum + Number(count || 0), 0);

                  const row = (
                    <tr key={`${chuDe}-${noiDung}-${yeuCau}`} className="hover:bg-gray-50 transition">
                      {isFirstOfChuDe && <td rowSpan={chuDeRowSpan} className="px-3 py-3 border border-border font-bold align-top bg-gray-50/50 text-primary"><MathText text={chuDe} /></td>}
                      {isFirstOfNoiDung && <td rowSpan={noiDungRowSpan} className="px-3 py-3 border border-border align-top"><MathText text={noiDung} /></td>}
                      <td className="px-3 py-3 border border-border text-left italic leading-relaxed"><MathText text={yeuCau} /></td>
                      {QUESTION_TYPES.map(qType => COGNITIVE_LEVELS_DOC.map(level => (<td key={`${qType}-${level}`} className="px-1 py-3 border border-border text-center font-bold text-primary">{countGroup[qType]?.[level] || ''}</td>)))}
                      <td className="px-1 py-3 border border-border text-center font-bold bg-gray-50">{rowTotal}</td>
                    </tr>
                  );
                  isFirstOfChuDe = false;
                  isFirstOfNoiDung = false;
                  return row;
                });
              });
            })}
          </tbody>
           <tfoot className="bg-primary/5 font-bold">
            <tr>
              <td colSpan={3} className="px-3 py-3 border border-border text-right uppercase">Tổng cộng câu hỏi</td>
              {QUESTION_TYPES.map(qType => COGNITIVE_LEVELS_DOC.map(level => (<td key={`${qType}-${level}`} className="px-1 py-3 border border-border text-center">{columnTotals[qType]?.[level] || 0}</td>)))}
              <td className="px-1 py-3 border border-border text-center text-primary">{grandTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="border-t border-border pt-6 flex justify-between items-center flex-wrap gap-4">
        <button onClick={onBack} disabled={isLoading} className="bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-xl hover:bg-gray-300 disabled:opacity-50 shadow-sm transition">Quay Lại</button>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <button onClick={handleExportExcel} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition flex items-center gap-2">
            Xuất Excel đặc tả
          </button>
          <button onClick={onSubmit} disabled={isLoading} className="bg-accent text-text-main font-bold py-3 px-10 rounded-xl hover:brightness-110 shadow-lg transition transform hover:-translate-y-0.5">
            {isLoading ? 'Đang tạo đề...' : 'Tiến Hành Tạo Đề'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecificationDisplay;