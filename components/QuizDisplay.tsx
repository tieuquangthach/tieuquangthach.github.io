
import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { QuizQuestion, QuizMatrix, QuizSpecification, QUESTION_TYPES, COGNITIVE_LEVELS_DOC, QuestionType, CognitiveLevelDoc, QUESTION_TYPE_POINTS } from '../types';
import { regenerateSingleQuestion } from '../services/geminiService';

interface HeaderInfo {
  ubnd: string;
  tenTruong: string;
  kyKiemTra: string;
  monHoc: string;
  thoiGian: string;
  maDe: string;
  namHoc: string;
}

interface QuizDisplayProps {
  questions: QuizQuestion[];
  matrix: QuizMatrix;
  specification: QuizSpecification;
  onBack?: () => void;
  onStartOver?: () => void;
  isLoading?: boolean;
  initialInfo?: {
    title: string;
    subject: string;
    duration: string;
    grade: string;
  };
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

export const MathText: React.FC<{ text: string }> = ({ text }) => {
  const parts = useMemo(() => {
    if (!text) return [];
    return text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);
  }, [text]);

  if (!text) return null;

  return (
    <span className="math-text-container inline whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => {
        if (!part) return null;

        const isBlock = part.startsWith('$$') && part.endsWith('$$');
        const isInline = !isBlock && part.startsWith('$') && part.endsWith('$');

        if ((isBlock || isInline) && (window as any).katex) {
          try {
            const formula = isBlock ? part.slice(2, -2) : part.slice(1, -1);
            const html = (window as any).katex.renderToString(formula, {
              displayMode: isBlock,
              throwOnError: false,
              strict: false
            });
            
            if (isBlock) {
              return (
                <div 
                  key={i} 
                  className="katex-display-wrapper my-4 overflow-x-auto text-center"
                  dangerouslySetInnerHTML={{ __html: html }} 
                />
              );
            } else {
              return (
                <React.Fragment key={i}>
                  <span 
                    className="katex-inline-wrapper"
                    dangerouslySetInnerHTML={{ __html: html }} 
                  />
                  <span className="inline-block w-1"> </span>
                </React.Fragment>
              );
            }
          } catch (e) {
            console.warn("Lỗi render KaTeX cho đoạn:", part, e);
            return <span key={i}>{part}</span>;
          }
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const GeometricDrawing: React.FC<{ code: string; id: string }> = ({ code, id }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (!canvasRef.current || !code) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    try {
      const drawFunc = new Function('ctx', 'canvas', code);
      drawFunc(ctx, canvas);
    } catch (err) {
      console.error("Lỗi khi vẽ hình học:", err);
      ctx.font = '12px Arial';
      ctx.fillStyle = 'red';
      ctx.fillText("Không thể vẽ hình minh họa", 10, 20);
    }
  }, [code]);

  return (
    <div className="flex justify-center my-4">
      <canvas 
        id={`canvas-${id}`}
        ref={canvasRef} 
        width={500} 
        height={300} 
        className="max-w-full h-auto border border-gray-100 rounded-lg bg-gray-50/30"
      />
    </div>
  );
};

const QuizDisplay: React.FC<QuizDisplayProps> = ({ questions: initialQuestions, matrix, specification, onBack, onStartOver, initialInfo }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showSpec, setShowSpec] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  
  const [headerInfo, setHeaderInfo] = useState<HeaderInfo>({
    ubnd: "UBND XÃ HÀM THUẬN NAM",
    tenTruong: "TRƯỜNG THCS HÀM MINH",
    kyKiemTra: initialInfo?.title || "KIỂM TRA CUỐI HỌC KỲ I",
    monHoc: initialInfo ? `${initialInfo.subject} ${initialInfo.grade}` : "Toán 9",
    thoiGian: initialInfo ? `${initialInfo.duration} phút` : "90 phút",
    maDe: "1",
    namHoc: "2025-2026"
  });

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const handleRegenerateQuestion = async (q: QuizQuestion) => {
    if (regeneratingId) return;
    setRegeneratingId(q.id);
    try {
      const newQuestion = await regenerateSingleQuestion(q, initialInfo?.grade || "9", headerInfo.monHoc);
      setQuestions(prev => prev.map(item => item.id === q.id ? newQuestion : item));
    } catch (err) {
      alert("Lỗi khi tạo lại câu hỏi. Vui lòng thử lại.");
    } finally {
      setRegeneratingId(null);
    }
  };

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

  const handleHeaderChange = (field: keyof HeaderInfo, value: string) => {
    setHeaderInfo(prev => ({ ...prev, [field]: value }));
  };

  const formatTextForWord = (text: string) => {
    if (!text) return '';
    const mathRegex = /\$\$?([\s\S]+?)\$\$?/g;
    
    return text.replace(mathRegex, (match, formula) => {
      try {
        if ((window as any).katex) {
          const isDisplay = match.startsWith('$$');
          const mathml = (window as any).katex.renderToString(formula.trim(), {
            displayMode: isDisplay,
            output: 'mathml',
            throwOnError: false
          });
          
          const mathMatch = mathml.match(/<math[\s\S]*?<\/math>/);
          if (mathMatch) {
            let clean = mathMatch[0]
              .replace(/<annotation[\s\S]*?<\/annotation>/g, '')
              .replace(/<semantics>/g, '').replace(/<\/semantics>/g, '');
            if (!clean.includes('xmlns=')) {
              clean = clean.replace('<math', '<math xmlns="http://www.w3.org/1998/Math/MathML"');
            }
            return isDisplay 
              ? `<div align="center" style="margin: 15pt 0;">${clean}</div>`
              : `<span>${clean} </span>`;
          }
        }
        return match;
      } catch (e) {
        return match;
      }
    }).replace(/\n/g, '<br>');
  };

  const getCanvasImageData = (id: string): string => {
    const canvas = document.getElementById(`canvas-${id}`) as HTMLCanvasElement;
    if (canvas) {
      try {
        return canvas.toDataURL("image/png");
      } catch (e) {
        console.error("Lỗi lấy dữ liệu ảnh canvas:", e);
      }
    }
    return '';
  };

  const getSafeFileNamePart = (text: string) => text.trim().replace(/\s+/g, '_').replace(/[\\/:"*?<>|]/g, '');

  const handleDownloadMatrixWord = () => {
    let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset="UTF-8">
        <style>
            table { border-collapse: collapse; width: 100%; font-family: 'Times New Roman'; font-size: 10pt; }
            th, td { border: 1pt solid black; padding: 5pt; text-align: center; }
            .header { font-weight: bold; background-color: #f3f4f6; }
        </style>
        </head>
        <body>
            <h2 style="text-align: center;">MA TRẬN ĐỀ KIỂM TRA</h2>
            <table>
                <thead>
                    <tr class="header">
                        <th rowspan="3">TT</th>
                        <th rowspan="3">Chương/Chủ đề</th>
                        <th rowspan="3">Nội dung</th>
                        <th colspan="12">Mức độ đánh giá</th>
                        <th rowspan="3">Tổng</th>
                    </tr>
                    <tr class="header">
                        ${QUESTION_TYPES.map(type => `<th colspan="3">${type}</th>`).join('')}
                    </tr>
                    <tr class="header">
                        ${QUESTION_TYPES.map(() => COGNITIVE_LEVELS_DOC.map(level => `<th>${level}</th>`).join('')).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${matrix.map((row, idx) => {
                        const total = QUESTION_TYPES.reduce((sum, qType) => sum + COGNITIVE_LEVELS_DOC.reduce((lsum, level) => lsum + (Number(row.counts[qType][level]) || 0), 0), 0);
                        return `
                            <tr>
                                <td>${idx + 1}</td>
                                <td style="text-align: left;">${row.topic}</td>
                                <td style="text-align: left;">${row.knowledgeUnit}</td>
                                ${QUESTION_TYPES.map(qType => COGNITIVE_LEVELS_DOC.map(level => `<td>${row.counts[qType][level] || ''}</td>`).join('')).join('')}
                                <td>${total}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </body></html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const fileName = `Ma_Tran_De_Kiem_Tra_${getSafeFileNamePart(headerInfo.kyKiemTra)}.doc`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const handleDownloadSpecWord = () => {
    let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset="UTF-8">
        <style>
            table { border-collapse: collapse; width: 100%; font-family: 'Times New Roman'; font-size: 10pt; }
            th, td { border: 1pt solid black; padding: 5pt; text-align: center; }
            .header { font-weight: bold; background-color: #f3f4f6; }
        </style>
        </head>
        <body>
            <h2 style="text-align: center;">BẢNG ĐẶC TẢ CHI TIẾT ĐỀ KIỂM TRA</h2>
            <table>
                <thead>
                    <tr class="header">
                        <th rowspan="3">Chủ đề</th>
                        <th rowspan="3">Nội dung</th>
                        <th rowspan="3">Yêu cầu cần đạt</th>
                        <th colspan="12">Mức độ đánh giá</th>
                    </tr>
                    <tr class="header">
                        ${QUESTION_TYPES.map(type => `<th colspan="3">${type}</th>`).join('')}
                    </tr>
                    <tr class="header">
                        ${QUESTION_TYPES.map(() => COGNITIVE_LEVELS_DOC.map(level => `<th>${level}</th>`).join('')).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(groupedSpecification).map(([chuDe, noiDungGroup]) => {
                        return Object.entries(noiDungGroup).map(([noiDung, yeuCauGroup]) => {
                            return Object.entries(yeuCauGroup).map(([yeuCau, countGroup]) => `
                                <tr>
                                    <td style="text-align: left;">${chuDe}</td>
                                    <td style="text-align: left;">${noiDung}</td>
                                    <td style="text-align: left; font-style: italic;">${yeuCau}</td>
                                    ${QUESTION_TYPES.map(qType => COGNITIVE_LEVELS_DOC.map(level => `<td>${countGroup[qType]?.[level] || ''}</td>`).join('')).join('')}
                                </tr>
                            `).join('');
                        }).join('');
                    }).join('')}
                </tbody>
            </table>
        </body></html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const fileName = `Bang_Dac_Ta_De_Kiem_Tra_${getSafeFileNamePart(headerInfo.kyKiemTra)}.doc`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const handleDownloadQuizWord = () => {
    const mcq = questions.filter(q => q.loaiCauHoi !== 'Tự luận');
    const essay = questions.filter(q => q.loaiCauHoi === 'Tự luận');

    let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset="UTF-8">
        <style>
            body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.3; }
            .header-table { width: 100%; border: 1pt solid black; border-collapse: collapse; margin-bottom: 20pt; }
            .header-table td { border: 1pt solid black; padding: 5pt; }
            .bold { font-weight: bold; }
            .center { text-align: center; }
            .uppercase { text-transform: uppercase; }
            .question-block { margin-bottom: 12pt; text-align: justify; }
            .ans-table { border-collapse: collapse; width: 100%; margin-top: 10pt; }
            .ans-table td { border: 1px solid black; padding: 5px; text-align: center; }
            .drawing-img { display: block; margin: 10pt auto; max-width: 400pt; }
        </style>
        </head>
        <body>
            <table class="header-table">
              <tr>
                <td colspan="2" style="height: 60pt; vertical-align: top;">
                  <p class="bold">Họ tên: ............................................................</p>
                  <p class="bold" style="margin-top: 10pt;">Lớp: ............................</p>
                </td>
                <td rowspan="2" class="center" style="vertical-align: middle;">
                  <p class="bold uppercase" style="font-size: 12pt;">${headerInfo.tenTruong}</p>
                  <p class="bold uppercase">${headerInfo.kyKiemTra}</p>
                  <p class="bold">Năm học: ${headerInfo.namHoc}</p>
                  <p class="bold uppercase">Môn: ${headerInfo.monHoc}</p>
                  <p class="bold">Thời gian: ${headerInfo.thoiGian}</p>
                  <p class="bold">Mã đề ${headerInfo.maDe}</p>
                </td>
                <td rowspan="2" class="center" style="width: 25%; vertical-align: top;">
                  <p class="bold">Họ tên và chữ ký của giáo viên coi kiểm tra</p>
                  <p style="margin-top: 40pt;">...................................................</p>
                  <p style="margin-top: 30pt;">...................................................</p>
                </td>
              </tr>
              <tr>
                <td class="center" style="width: 20%; height: 60pt;"><p class="bold">Điểm trắc nghiệm</p></td>
                <td class="center" style="width: 20%; height: 60pt;"><p class="bold">Điểm tổng</p></td>
              </tr>
            </table>
            
            <p class="bold uppercase" style="margin-top: 20pt">PHẦN I. TRẮC NGHIỆM (3,0 điểm)</p>
            ${mcq.map((q, i) => {
              const imgData = q.drawingCode ? getCanvasImageData(q.id) : '';
              return `
                <div class="question-block">
                  <span class="bold">Câu ${i+1}:</span> ${formatTextForWord(q.cauHoi)}
                  ${imgData ? `<div style="text-align: center;"><img src="${imgData}" class="drawing-img" width="350"/></div>` : ''}
                </div>
              `;
            }).join('')}
            ${essay.length ? `
              <p class="bold uppercase" style="margin-top: 20pt">PHẦN II. TỰ LUẬN (7,0 điểm)</p>
              ${essay.map((q, i) => {
                const imgData = q.drawingCode ? getCanvasImageData(q.id) : '';
                return `
                  <div class="question-block">
                    <span class="bold">Câu ${mcq.length + i + 1}:</span> ${formatTextForWord(q.cauHoi)}
                    ${imgData ? `<div style="text-align: center;"><img src="${imgData}" class="drawing-img" width="350"/></div>` : ''}
                  </div>
                `;
              }).join('')}
            ` : ''}
            <br style="page-break-before: always;">
            <h2 class="center bold">ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM</h2>
            ${mcq.length ? `
                <p class="bold">I. TRẮC NGHIỆM</p>
                <table class="ans-table">
                    <tr><td class="bold">Câu</td>${mcq.map((_, i) => `<td>${i+1}</td>`).join('')}</tr>
                    <tr><td class="bold">Đáp án</td>${mcq.map(q => `<td class="bold">${q.dapAn}</td>`).join('')}</tr>
                </table>
            ` : ''}
            ${essay.length ? `
              <p class="bold" style="margin-top: 20pt">II. TỰ LUẬN</p>
              ${essay.map((q, i) => {
                const imgData = q.drawingCode ? getCanvasImageData(q.id) : '';
                return `
                  <div style="margin-bottom: 15pt; border: 1px solid #ccc; padding: 5pt;">
                    <p class="bold">Câu ${mcq.length + i + 1}:</p>
                    <p>${formatTextForWord(q.huongDanChamDiem)}</p>
                    ${imgData ? `<div style="text-align: center;"><img src="${imgData}" class="drawing-img" width="200"/></div>` : ''}
                    <p><span class="bold">Đáp án:</span> ${formatTextForWord(q.dapAn)}</p>
                  </div>
                `;
              }).join('')}
            ` : ''}
        </body></html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const fileName = `De_Kiem_Tra_${getSafeFileNamePart(headerInfo.kyKiemTra)}_Lop_${initialInfo?.grade || ''}_MaDe_${headerInfo.maDe}.doc`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const handleDownloadLatex = () => {
    const mcq = questions.filter(q => q.loaiCauHoi !== 'Tự luận');
    const essay = questions.filter(q => q.loaiCauHoi === 'Tự luận');

    let tex = `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath, amssymb, amsfonts}
\\usepackage{geometry}
\\usepackage{graphicx}
\\geometry{a4paper, margin=2cm}

\\begin{document}
\\section*{ĐỀ KIỂM TRA}
\\noindent
\\begin{center}
\\textbf{${headerInfo.tenTruong}} \\\\
\\textbf{${headerInfo.kyKiemTra}} \\\\
\\textbf{Năm học: ${headerInfo.namHoc}} \\\\
\\textbf{Môn: ${headerInfo.monHoc}} \\\\
\\textbf{Thời gian: ${headerInfo.thoiGian}} \\\\
\\textbf{MÃ ĐỀ: ${headerInfo.maDe}}
\\end{center}

\\section*{PHẦN I. TRẮC NGHIỆM}
`;
    mcq.forEach((q, i) => {
      tex += `\\noindent \\textbf{Câu ${i + 1}:} ${q.cauHoi.replace(/\$/g, '$')}\n\n`;
      if (q.drawingCode) {
        tex += `\\% [Hình vẽ minh họa câu ${i+1}: Vẽ hình dựa trên dữ liệu bài toán]\n\n`;
      }
    });

    if (essay.length > 0) {
      tex += `\\section*{PHẦN II. TỰ LUẬN}\n`;
      essay.forEach((q, i) => {
        tex += `\\noindent \\textbf{Câu ${mcq.length + i + 1}:} ${q.cauHoi.replace(/\$/g, '$')}\n\n`;
        if (q.drawingCode) {
          tex += `\\% [Hình vẽ minh họa câu ${mcq.length + i + 1}]\n\n`;
        }
      });
    }

    tex += `\\newpage
\\section*{ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM}
`;
    if (mcq.length > 0) {
      tex += `\\subsection*{I. Trắc nghiệm}\n\\begin{tabular}{|c|${mcq.map(() => 'c').join('|')}|}\n\\hline\n`;
      tex += `Câu & ${mcq.map((_, i) => i + 1).join(' & ')} \\\\ \\hline\n`;
      tex += `Đáp án & ${mcq.map(q => q.dapAn).join(' & ')} \\\\ \\hline\n`;
      tex += `\\end{tabular}\n`;
    }

    if (essay.length > 0) {
      tex += `\\subsection*{II. Tự luận}\n`;
      essay.forEach((q, i) => {
        tex += `\\noindent \\textbf{Câu ${mcq.length + i + 1}:}\n\\\\ ${q.huongDanChamDiem.replace(/\$/g, '$')}\n\\\\ \\textbf{Đáp án:} ${q.dapAn}\n\n`;
      });
    }

    tex += `\\end{document}`;

    const blob = new Blob([tex], { type: 'text/plain;charset=utf-8' });
    const fileName = `De_Kiem_Tra_${getSafeFileNamePart(headerInfo.kyKiemTra)}_Lop_${initialInfo?.grade || ''}_MaDe_${headerInfo.maDe}.tex`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const mcqQuestions = questions.filter(q => q.loaiCauHoi !== 'Tự luận');
  const essayQuestions = questions.filter(q => q.loaiCauHoi === 'Tự luận');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Tùy chỉnh & Xuất file</h2>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={handleDownloadMatrixWord} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition flex items-center gap-2 text-xs">
            Tải Ma Trận
          </button>
          <button onClick={handleDownloadSpecWord} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition flex items-center gap-2 text-xs">
            Tải Đặc Tả
          </button>
          <button onClick={handleDownloadQuizWord} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition flex items-center gap-2 text-xs">
            Tải Đề (Word)
          </button>
          <button onClick={handleDownloadLatex} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition flex items-center gap-2 text-xs">
            Tải Đề (LaTeX)
          </button>
          <button onClick={onBack} className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-4 rounded-xl border border-gray-200 transition text-xs">
            Quay lại Ma trận
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Cơ quan chủ quản</label>
            <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none" value={headerInfo.ubnd} onChange={(e) => handleHeaderChange('ubnd', e.target.value)}/>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Tên trường</label>
            <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none" value={headerInfo.tenTruong} onChange={(e) => handleHeaderChange('tenTruong', e.target.value)}/>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Môn thi</label>
            <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none" value={headerInfo.monHoc} onChange={(e) => handleHeaderChange('monHoc', e.target.value)}/>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Mã đề</label>
            <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-blue-600 outline-none text-center" value={headerInfo.maDe} onChange={(e) => handleHeaderChange('maDe', e.target.value)}/>
          </div>
      </div>

      <div className="flex justify-center py-4 bg-gray-100 rounded-3xl">
        <div className="w-full max-w-5xl bg-white shadow-2xl border border-gray-100 p-8 md:p-16 font-serif leading-normal min-h-[1000px] text-black relative">
          
          <div className="mb-10 overflow-hidden">
            <table className="w-full border-collapse border-2 border-black text-sm">
              <tbody>
                <tr>
                  <td colSpan={2} className="border border-black p-3 align-top h-24 w-1/3">
                    <p className="font-bold">Họ tên: ............................................................</p>
                    <p className="font-bold mt-4">Lớp: ............................</p>
                  </td>
                  <td rowSpan={2} className="border border-black p-3 text-center align-middle w-1/3">
                    <p className="font-bold uppercase text-base leading-tight">{headerInfo.tenTruong}</p>
                    <p className="font-bold uppercase text-base mt-1 leading-tight">{headerInfo.kyKiemTra}</p>
                    <p className="font-bold mt-1">Năm học: {headerInfo.namHoc}</p>
                    <p className="font-bold uppercase mt-1">Môn: {headerInfo.monHoc}</p>
                    <p className="font-bold mt-1">Thời gian: {headerInfo.thoiGian}</p>
                    <p className="font-bold mt-1">Mã đề {headerInfo.maDe}</p>
                  </td>
                  <td rowSpan={2} className="border border-black p-3 text-center align-top w-1/3">
                    <p className="font-bold leading-tight">Họ tên và chữ ký của giáo viên coi kiểm tra</p>
                    <div className="mt-12 space-y-8">
                       <p className="text-gray-400">...........................................................</p>
                       <p className="text-gray-400">...........................................................</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-3 text-center align-middle h-24">
                    <p className="font-bold">Điểm trắc nghiệm</p>
                  </td>
                  <td className="border border-black p-3 text-center align-middle h-24">
                    <p className="font-bold">Điểm tổng</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-10 text-base text-justify">
            {mcqQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="font-bold uppercase underline tracking-tight">PHẦN I. TRẮC NGHIỆM (3,0 điểm)</div>
                {mcqQuestions.map((q, i) => (
                  <div key={q.id} className="pl-2 relative group">
                    <button 
                      onClick={() => handleRegenerateQuestion(q)}
                      disabled={!!regeneratingId}
                      className={`absolute -left-12 top-0 p-1.5 rounded-full bg-white border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-50 ${regeneratingId === q.id ? 'opacity-100' : ''}`}
                      title="Tạo lại câu hỏi này"
                    >
                      <svg className={`w-4 h-4 text-primary ${regeneratingId === q.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    
                    <div className={regeneratingId === q.id ? 'opacity-30 blur-[1px] transition-all' : 'transition-all'}>
                      <span className="font-bold">Câu {i+1}: </span>
                      <MathText text={q.cauHoi} />
                      {q.drawingCode && <GeometricDrawing id={q.id} code={q.drawingCode} />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {essayQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="font-bold uppercase underline tracking-tight">PHẦN II. TỰ LUẬN (7,0 điểm)</div>
                {essayQuestions.map((q, i) => (
                  <div key={q.id} className="pl-2 relative group">
                    <button 
                      onClick={() => handleRegenerateQuestion(q)}
                      disabled={!!regeneratingId}
                      className={`absolute -left-12 top-0 p-1.5 rounded-full bg-white border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-50 ${regeneratingId === q.id ? 'opacity-100' : ''}`}
                      title="Tạo lại câu hỏi này"
                    >
                      <svg className={`w-4 h-4 text-primary ${regeneratingId === q.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    
                    <div className={regeneratingId === q.id ? 'opacity-30 blur-[1px] transition-all' : 'transition-all'}>
                      <span className="font-bold">Câu {mcqQuestions.length + i + 1}: </span>
                      <MathText text={q.cauHoi} />
                      {q.drawingCode && <GeometricDrawing id={q.id} code={q.drawingCode} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-20 text-center italic text-sm">--- HẾT ---</div>
        </div>
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
        <button onClick={() => { setShowMatrix(!showMatrix); setShowSpec(false); setShowAnswers(false); }} className={`px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-sm text-sm ${showMatrix ? 'bg-slate-700 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          {showMatrix ? 'Ẩn ma trận' : 'Xem Ma Trận Thiết Kế'}
        </button>
        <button onClick={() => { setShowSpec(!showSpec); setShowMatrix(false); setShowAnswers(false); }} className={`px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-sm text-sm ${showSpec ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          {showSpec ? 'Ẩn bảng đặc tả' : 'Xem Bảng Đặc Tả Chi Tiết'}
        </button>
        <button onClick={() => { setShowAnswers(!showAnswers); setShowMatrix(false); setShowSpec(false); }} className={`px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-sm text-sm ${showAnswers ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          {showAnswers ? 'Ẩn đáp án' : 'Xem Đáp Án & Hướng Dẫn'}
        </button>
      </div>

      {showMatrix && (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6 max-w-6xl mx-auto animate-fade-in overflow-hidden">
          <h3 className="text-xl font-bold text-center text-slate-700 uppercase">MA TRẬN ĐỀ KIỂM TRA ĐÃ THIẾT KẾ</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-[10px] text-center border-collapse bold-grid">
              <thead className="bg-slate-700 text-white">
                <tr>
                  <th rowSpan={3} className="p-2 uppercase font-black">TT</th>
                  <th rowSpan={3} className="p-2 uppercase font-black">Chương/Chủ đề</th>
                  <th rowSpan={3} className="p-2 uppercase font-black">Nội dung</th>
                  <th colSpan={12} className="p-2 uppercase font-black">Mức độ đánh giá</th>
                  <th rowSpan={3} className="p-2 uppercase font-black">Tổng</th>
                </tr>
                <tr className="bg-slate-600">
                  {QUESTION_TYPES.map(type => <th key={type} colSpan={3} className="p-1 uppercase">{type}</th>)}
                </tr>
                <tr className="bg-slate-500">
                  {QUESTION_TYPES.map(qType => COGNITIVE_LEVELS_DOC.map(level => <th key={`${qType}-${level}`} className="p-1">{level}</th>))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, idx) => {
                   const total = QUESTION_TYPES.reduce((sum, qType) => sum + COGNITIVE_LEVELS_DOC.reduce((lsum, level) => lsum + (Number(row.counts[qType][level]) || 0), 0), 0);
                   return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-bold">{idx + 1}</td>
                      <td className="p-2 text-left font-bold">{row.topic}</td>
                      <td className="p-2 text-left">{row.knowledgeUnit}</td>
                      {QUESTION_TYPES.map(qType => COGNITIVE_LEVELS_DOC.map(level => (
                        <td key={`${qType}-${level}`} className="p-1 font-bold">{row.counts[qType][level] || ''}</td>
                      )))}
                      <td className="p-2 font-black bg-slate-50">{total}</td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSpec && (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6 max-w-6xl mx-auto animate-fade-in overflow-hidden">
          <h3 className="text-xl font-bold text-center text-primary uppercase">BẢNG ĐẶC TẢ CHI TIẾT ĐỀ KIỂM TRA</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-[10px] text-center border-collapse bold-grid">
              <thead className="bg-indigo-700 text-white">
                <tr>
                  <th rowSpan={3} className="p-2 uppercase font-black">Chủ đề</th>
                  <th rowSpan={3} className="p-2 uppercase font-black">Nội dung</th>
                  <th rowSpan={3} className="p-2 uppercase font-black">Yêu cầu cần đạt</th>
                  <th colSpan={12} className="p-2 uppercase font-black">Mức độ đánh giá</th>
                </tr>
                <tr className="bg-indigo-600">
                  {QUESTION_TYPES.map(type => (<th key={type} colSpan={3} className="p-1 uppercase">{type}</th>))}
                </tr>
                <tr className="bg-indigo-500">
                  {QUESTION_TYPES.map(qType => COGNITIVE_LEVELS_DOC.map(level => (<th key={`${qType}-${level}`} className="p-1 font-bold">{level}</th>)))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(groupedSpecification).map(([chuDe, noiDungGroup]) => {
                  const chuDeRowSpan = Object.values(noiDungGroup).reduce((sum, yeuCauGroup) => sum + Object.keys(yeuCauGroup).length, 0);
                  let isFirstOfChuDe = true;

                  return Object.entries(noiDungGroup).map(([noiDung, yeuCauGroup]) => {
                    const noiDungRowSpan = Object.keys(yeuCauGroup).length;
                    let isFirstOfNoiDung = true;

                    return Object.entries(yeuCauGroup).map(([yeuCau, countGroup]) => {
                      const row = (
                        <tr key={`${chuDe}-${noiDung}-${yeuCau}`} className="hover:bg-indigo-50/30">
                          {isFirstOfChuDe && <td rowSpan={chuDeRowSpan} className="p-2 font-bold align-top bg-gray-50/50"><MathText text={chuDe} /></td>}
                          {isFirstOfNoiDung && <td rowSpan={noiDungRowSpan} className="p-2 align-top"><MathText text={noiDung} /></td>}
                          <td className="p-2 text-left italic"><MathText text={yeuCau} /></td>
                          {QUESTION_TYPES.map(qType => COGNITIVE_LEVELS_DOC.map(level => (<td key={`${qType}-${level}`} className="p-1 font-bold text-primary">{countGroup[qType]?.[level] || ''}</td>)))}
                        </tr>
                      );
                      isFirstOfChuDe = false;
                      isFirstOfNoiDung = false;
                      return row;
                    });
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAnswers && (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-xl space-y-12 font-serif animate-fade-in max-w-5xl mx-auto">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-primary uppercase">ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM</h3>
              <p className="font-bold italic">MÔN: {headerInfo.monHoc}</p>
            </div>

            {mcqQuestions.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-bold text-lg border-b-2 border-primary inline-block uppercase">I. TRẮC NGHIỆM</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead><tr className="bg-gray-50">
                      <th className="border border-black p-2 font-bold w-12 text-center">Câu</th>
                      {mcqQuestions.map((_, i) => <th key={i} className="border border-black p-2 text-center">{i+1}</th>)}
                    </tr></thead>
                    <tbody><tr>
                      <td className="border border-black p-2 font-bold bg-gray-50 text-center">Đáp án</td>
                      {mcqQuestions.map((q, i) => <td key={i} className="border border-black p-2 text-center font-bold text-blue-600">{q.dapAn}</td>)}
                    </tr></tbody>
                  </table>
                </div>
              </div>
            )}

            {essayQuestions.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-bold text-lg border-b-2 border-primary inline-block uppercase">II. TỰ LUẬN</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead><tr className="bg-gray-50">
                      <th className="border border-black p-3 font-bold w-16 text-center">Bài</th>
                      <th className="border border-black p-3 font-bold text-center">Nội dung lời giải chi tiết</th>
                      <th className="border border-black p-3 font-bold w-20 text-center">Điểm</th>
                    </tr></thead>
                    <tbody>
                      {essayQuestions.map((q, i) => (
                        <tr key={i}>
                          <td className="border border-black p-4 text-center font-bold align-top">{i+1}</td>
                          <td className="border border-black p-6 align-top">
                            <div className="space-y-4">
                              <MathText text={q.huongDanChamDiem} />
                              {q.drawingCode && (
                                <div className="mt-4 border-t pt-4">
                                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Hình vẽ minh họa:</p>
                                  <GeometricDrawing id={`ans-${q.id}`} code={q.drawingCode} />
                                </div>
                              )}
                              <div className="pt-2 border-t border-dashed border-gray-200">
                                <span className="font-bold text-blue-600">Kết quả: </span>
                                <MathText text={q.dapAn} />
                              </div>
                            </div>
                          </td>
                          <td className="border border-black p-4 text-center font-bold align-top">1,0đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default QuizDisplay;
