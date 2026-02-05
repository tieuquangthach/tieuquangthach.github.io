
import React, { useState, useEffect, useRef } from 'react';
import { PhieuBaiTap } from '../types';
import { generateSmartWorksheet } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { SGK_CURRICULUM } from '../constants';

// --- SOUND EFFECTS ---
const playSound = (type: 'correct' | 'wrong') => {
  const audio = new Audio(
    type === 'correct' 
      ? 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg' 
      : 'https://actions.google.com/sounds/v1/cartoon/clank_car_crash.ogg'
  );
  audio.volume = 0.5;
  audio.play().catch(e => console.log("Audio play failed", e));
};

// --- HELPER: NORMALIZE ANSWER TEXT ---
const normalizeAnswer = (str: string | undefined | null) => {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .trim()
    .replace(/[\$\(\)\\]/g, '') // Loại bỏ ký hiệu toán học LaTeX thừa
    .replace(/\s+/g, '') // Loại bỏ tất cả khoảng trắng
    .replace(/,/g, '.')  // Chuyển dấu phẩy thập phân thành chấm (VN -> EN)
    .replace(/^([abcd])[\.:\)]/i, '$1'); // Chuẩn hóa prefix: "A. " -> "a"
};

// --- CUSTOM MATHJAX IMPLEMENTATION ---
const MathJaxContext = ({ children }: { children?: React.ReactNode }) => {
  useEffect(() => {
    // Load font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Config MathJax
    if (!(window as any).MathJax) {
      (window as any).MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          packages: { '[+]': ['noerrors', 'noundefined'] }
        },
        loader: { load: ['[tex]/noerrors', '[tex]/noundefined'] },
        svg: { fontCache: 'global', scale: 1.2 }, 
        startup: { typeset: false }
      };
      
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);
  return <>{children}</>;
};

// Sử dụng React.memo để ngăn chặn việc render lại khi props không đổi
const MathJax = React.memo(({ children, inline }: { children?: string | number, inline?: boolean }) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !children) return;

    const typeset = () => {
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        // Typeset content
        (window as any).MathJax.typesetPromise([el])
          .catch((err: any) => console.log('MathJax error:', err));
      }
    };

    // Retry mechanism if MathJax isn't ready
    if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
      typeset();
    } else {
      const interval = setInterval(() => {
        if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
          typeset();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [children]); // Chỉ chạy lại khi nội dung thay đổi

  const Component = inline ? 'span' : 'div';
  return <Component ref={ref} dangerouslySetInnerHTML={{ __html: String(children || '') }} style={{ display: inline ? 'inline' : 'block' }} />;
});

interface SmartWorksheetProps {
  initialData: PhieuBaiTap | null;
  initialGrade: string;
  targetType: 'Luyện tập' | 'Tự luyện';
  userRole: 'hocSinh' | 'giaoVien';
  onBack: () => void;
  onRefresh: () => void;
}

const SmartWorksheet: React.FC<SmartWorksheetProps> = ({
  initialData,
  initialGrade,
  targetType,
  userRole,
  onBack,
  onRefresh
}) => {
  const [step, setStep] = useState<'input' | 'worksheet'>('input');
  const [worksheetData, setWorksheetData] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string>('6');
  
  // Selection States
  const [selectedChapter, setSelectedChapter] = useState('');
  const [lessonName, setLessonName] = useState('');
  const [isCustomLesson, setIsCustomLesson] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  
  // Grading State
  const [questionStatus, setQuestionStatus] = useState<Record<string, 'correct' | 'wrong' | null>>({}); 
  const [lockedQuestions, setLockedQuestions] = useState<Record<string, boolean>>({}); 
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({}); // For Luyện tập
  const [visibleHints, setVisibleHints] = useState<Record<string, boolean>>({}); // For Tự luyện

  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  
  const [attachedFile, setAttachedFile] = useState<{ base64: string, mimeType: string, name: string } | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- THEME LOGIC ---
  const getThemeColors = (gradeStr: string) => {
    const grade = gradeStr.replace(/[^0-9]/g, '');
    switch(grade) {
        case '6':
        case '7':
            return {
                bg: 'bg-green-50',
                header: 'bg-gradient-to-r from-orange-500 to-green-600',
                accent: 'text-orange-600',
                border: 'border-green-200',
                active: 'bg-[#FFCA28] border-[#FFCA28] text-slate-900',
                button: 'bg-orange-500 hover:bg-orange-600',
                partHeader: 'text-green-800'
            };
        case '8':
            return {
                bg: 'bg-teal-50',
                header: 'bg-[#00695C]',
                accent: 'text-teal-700',
                border: 'border-teal-200',
                active: 'bg-[#FFCA28] border-[#FFCA28] text-slate-900',
                button: 'bg-[#00695C] hover:bg-teal-800',
                partHeader: 'text-[#00695C]'
            };
        case '9':
            return {
                bg: 'bg-blue-50',
                header: 'bg-[#0D47A1]',
                accent: 'text-blue-800',
                border: 'border-blue-200',
                active: 'bg-[#FFCA28] border-[#FFCA28] text-slate-900',
                button: 'bg-[#0D47A1] hover:bg-blue-900',
                partHeader: 'text-[#0D47A1]'
            };
        default:
            return {
                bg: 'bg-slate-50',
                header: 'bg-slate-800',
                accent: 'text-slate-700',
                border: 'border-slate-200',
                active: 'bg-[#FFCA28] border-[#FFCA28] text-slate-900',
                button: 'bg-slate-800',
                partHeader: 'text-slate-800'
            };
    }
  };

  const currentGrade = (initialData?.lop) ? `Toán ${initialData.lop}` : (initialGrade || selectedClass);
  const theme = getThemeColors(currentGrade);

  const resetGrading = () => {
    setUserAnswers({});
    setQuestionStatus({});
    setLockedQuestions({});
    setShowExplanation({});
    setVisibleHints({});
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setIsSaved(false); // Reset saved status
  };

  useEffect(() => {
    if (initialData) {
      setWorksheetData(initialData.noiDung);
      if (initialData.lop) {
        setSelectedClass(initialData.lop);
      }
      setStep('worksheet');
      resetGrading();
    } else {
      setStep('input');
      if (initialGrade) {
        setSelectedClass(initialGrade);
      }
      setWorksheetData(null);
      setLessonName('');
      setAttachedFile(null);
    }
  }, [initialData, initialGrade]);

  // Update Chapter when Class changes
  // Use data from SGK_CURRICULUM
  const gradeChapters = SGK_CURRICULUM[selectedClass] ? Object.keys(SGK_CURRICULUM[selectedClass]) : [];

  useEffect(() => {
    if (step === 'input') {
        if (gradeChapters.length > 0) {
            setSelectedChapter(gradeChapters[0]);
        } else {
            setSelectedChapter('');
        }
        setLessonName(''); // Reset lesson name
        setIsCustomLesson(false);
    }
  }, [selectedClass, step]);

  const isFileMode = worksheetData && (
    worksheetData.type === 'uploaded_file' || 
    (worksheetData.data && typeof worksheetData.data === 'string' && (!worksheetData.questions || worksheetData.questions.length === 0))
  );

  // File Handling for View Mode
  useEffect(() => {
    if (isFileMode && worksheetData?.data) {
        const rawData = worksheetData.data;
        if (typeof rawData === 'string' && rawData.startsWith('data:')) {
            try {
                const arr = rawData.split(',');
                const mimeMatch = arr[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while(n--) u8arr[n] = bstr.charCodeAt(n);
                const blob = new Blob([u8arr], {type: mime});
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
                return () => URL.revokeObjectURL(url);
            } catch (e) { setBlobUrl(rawData); }
        } else { setBlobUrl(rawData); }
    } else { setBlobUrl(null); }
  }, [worksheetData, isFileMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        if (ev.target?.result) {
            setAttachedFile({
                base64: ev.target.result as string,
                mimeType: file.type,
                name: file.name
            });
            // Auto fill lesson name from file name
            if (!lessonName) {
                setLessonName(file.name.replace(/\.[^/.]+$/, ""));
                setIsCustomLesson(true); // Switch to custom input mode
            }
        }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!lessonName && !attachedFile) {
        alert("Vui lòng chọn bài học hoặc tải lên tài liệu.");
        return;
    }

    setIsLoading(true);
    resetGrading();
    try {
        // FIX: Nếu có file đính kèm, chỉ dùng tên bài (tên file), không ghép với Chương mặc định
        // Nếu không có file (tự nhập), mới ghép Chương + Tên bài
        const fullLessonTitle = (attachedFile) 
            ? lessonName 
            : (selectedChapter ? `${selectedChapter} - ${lessonName}` : lessonName);

        const data = await generateSmartWorksheet(
            fullLessonTitle, 
            selectedClass, 
            targetType, 
            attachedFile ? { base64: attachedFile.base64, mimeType: attachedFile.mimeType } : undefined
        );
        setWorksheetData(data);
        setStep('worksheet');
    } catch (error: any) {
        alert(error.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!worksheetData) return;
    if (isSaved) return; // Prevent double save

    setIsSaving(true);
    const nameToSave = worksheetData.lessonName || lessonName || 'Bài tập mới';
    
    try {
        const { error } = await supabase.from('phieu_bai_tap').insert([{
            ten_phieu: nameToSave,
            lop: selectedClass,
            mon_hoc: targetType, 
            noi_dung: worksheetData
        }]);

        if (error) throw error;
        
        // Success Effect Logic
        setIsSaved(true);
        onRefresh();
        
        // Reset saved state after 3 seconds
        setTimeout(() => {
            setIsSaved(false);
        }, 3000);

    } catch (e: any) {
        alert("Lỗi lưu: " + e.message);
    } finally {
        setIsSaving(false);
    }
  };

  // --- IMMEDIATE GRADING LOGIC (ROBUST VERSION) ---
  const handleImmediateCheck = (
      qId: string, 
      userVal: string, 
      type: 'multiple_choice' | 'true_false' | 'short_answer', 
      correctAns: string,
      options: string[] = [] // Optional: Truyền options vào để đối chiếu nếu cần
  ) => {
    if (lockedQuestions[qId]) return;

    // 1. Chuẩn hóa dữ liệu đầu vào
    const cleanUser = normalizeAnswer(userVal);
    const cleanCorrect = normalizeAnswer(correctAns);

    let isCorrect = false;

    // 2. Logic so sánh
    if (type === 'multiple_choice') {
        // Chiến lược 1: So sánh trực tiếp (VD: "a" == "a")
        if (cleanUser === cleanCorrect) {
            isCorrect = true;
        } 
        // Chiến lược 2: So sánh prefix (VD: AI trả về "A. 50km", User chọn "A")
        // Kiểm tra xem Correct có bắt đầu bằng User không (User luôn là "a", "b"...)
        else if (cleanCorrect.startsWith(cleanUser)) {
             isCorrect = true;
        }
        // Chiến lược 3: So sánh nội dung text (Nếu AI trả về nội dung "50km" thay vì "A")
        else if (options.length > 0) {
            // Tìm nội dung của đáp án người dùng chọn (VD: User chọn A -> lấy text của option A)
            const userSelectionIndex = userVal.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1
            if (options[userSelectionIndex]) {
                 const cleanOptionContent = normalizeAnswer(options[userSelectionIndex]);
                 // Nếu nội dung option chứa đáp án đúng hoặc ngược lại
                 if (cleanOptionContent.includes(cleanCorrect) || cleanCorrect.includes(cleanOptionContent)) {
                     isCorrect = true;
                 }
            }
        }
    } else {
       // Tự luận & Đúng/Sai
       // Chấp nhận match tương đối
       isCorrect = cleanUser === cleanCorrect;
       
       // Fallback cho True/False (Tiếng Việt/Anh)
       if (!isCorrect && type === 'true_false') {
           const mapTrue = ['dung', 'true', 't', 'đúng'];
           const mapFalse = ['sai', 'false', 'f'];
           
           if (mapTrue.includes(cleanUser) && mapTrue.includes(cleanCorrect)) isCorrect = true;
           if (mapFalse.includes(cleanUser) && mapFalse.includes(cleanCorrect)) isCorrect = true;
       }
    }

    playSound(isCorrect ? 'correct' : 'wrong');

    setQuestionStatus(prev => ({ ...prev, [qId]: isCorrect ? 'correct' : 'wrong' }));
    setLockedQuestions(prev => ({ ...prev, [qId]: true }));
    setUserAnswers(prev => ({ ...prev, [qId]: userVal }));

    // Points logic
    const totalQuestions = worksheetData?.questions?.length || 1;
    const pointPerQuestion = totalQuestions >= 20 ? 0.5 : 1;

    if (isCorrect) {
        setCorrectCount(prev => prev + 1);
        setScore(prev => prev + pointPerQuestion);
    } else {
        setWrongCount(prev => prev + 1);
    }
  };

  const handleInputChange = (qId: string, value: string) => {
      if (lockedQuestions[qId]) return;
      setUserAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const renderUploadedFile = () => {
    const fileSrc = blobUrl || worksheetData?.data;
    if (!fileSrc) return <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Không thể hiển thị nội dung file.</div>;

    const isImage = worksheetData?.fileType?.startsWith('image/') || (typeof worksheetData?.data === 'string' && worksheetData.data.startsWith('data:image'));

    if (isImage) {
      return (
        <div className="w-full h-full overflow-auto flex items-start justify-center bg-slate-100 p-4">
           <img src={fileSrc} alt="Worksheet" className="max-w-full h-auto shadow-lg" />
        </div>
      );
    }

    return (
      <iframe 
        src={fileSrc} 
        className="w-full h-full border-none bg-white"
        title="File Viewer"
      />
    );
  };

  // Helper to get lessons for current selection
  // Access data safely
  const availableLessons = (SGK_CURRICULUM[selectedClass] && SGK_CURRICULUM[selectedClass][selectedChapter]) || [];
  const isSelfPractice = targetType === 'Tự luyện';

  return (
    <MathJaxContext>
        <style>{`
          body { font-family: 'Montserrat', sans-serif !important; }
          
          /* TABLE STYLING FOR MATH CONTENT */
          .worksheet-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          .worksheet-content th, .worksheet-content td {
            border: 1px solid #cbd5e1;
            padding: 12px;
            text-align: center;
          }
          .worksheet-content th {
            background-color: #f1f5f9;
            font-weight: 800;
            color: #475569;
          }
          .worksheet-content tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          /* SVG STYLING */
          .worksheet-content svg {
            display: block;
            margin: 0 auto 16px auto;
            max-width: 100%;
            height: auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background-color: #fcfcfc;
          }

          /* ANIMATION FOR SAVE BUTTON */
          @keyframes pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          .animate-pop {
            animation: pop 0.3s ease-out;
          }
        `}</style>

    <div className={`min-h-screen ${theme.bg} p-4 md:p-8 fixed inset-0 z-[60] overflow-y-auto`}>
       {/* Close Button - UPDATED */}
       <button 
         onClick={onBack}
         className="fixed top-4 right-4 z-[70] bg-white border-2 border-slate-100 hover:border-red-100 hover:bg-red-50 text-slate-500 hover:text-red-50 px-6 py-3 rounded-full shadow-xl transition-all active:scale-95 flex items-center gap-3 group"
       >
         <span className="font-black text-xs uppercase tracking-[0.2em] group-hover:tracking-[0.3em] transition-all">Đóng</span>
         <div className="w-6 h-6 bg-slate-100 group-hover:bg-red-100 rounded-full flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-sm font-bold">close</span>
         </div>
       </button>
       
       {/* --- NEW FIXED COMPACT SCOREBOARD (Chỉ hiện khi làm bài và không phải file mode) --- */}
       {step === 'worksheet' && !isFileMode && worksheetData && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] bg-white rounded-2xl shadow-2xl border-t-4 border-blue-600 px-6 py-2 flex items-center gap-6 md:gap-10 animate-fadeIn transition-all">
             {/* Progress */}
             <div className="flex flex-col items-center">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tiến độ làm bài</span>
                 <div className="flex items-baseline gap-1">
                     <span className={`text-2xl font-black ${Object.keys(lockedQuestions).length === (worksheetData.questions?.length || 0) ? 'text-green-500' : 'text-slate-800'}`}>
                         {Object.keys(lockedQuestions).length}
                     </span>
                     <span className="text-sm font-bold text-slate-300">/{worksheetData.questions?.length || 0}</span>
                 </div>
             </div>

             <div className="w-px h-8 bg-slate-100 hidden md:block"></div>

             {/* Status Icons */}
             <div className="flex items-center gap-6">
                 <div className="flex flex-col items-center">
                     <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-1 shadow-sm">
                         <span className="material-symbols-outlined text-lg">check</span>
                     </div>
                     <span className="text-sm font-black text-green-600 leading-none">{correctCount}</span>
                     <span className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">ĐÚNG</span>
                 </div>
                 <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 mb-1 shadow-sm">
                         <span className="material-symbols-outlined text-lg">close</span>
                     </div>
                     <span className="text-sm font-black text-red-600 leading-none">{wrongCount}</span>
                     <span className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">SAI</span>
                 </div>
             </div>

             <div className="w-px h-8 bg-slate-100 hidden md:block"></div>

             {/* Score */}
             <div className="flex flex-col items-center bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 min-w-[80px]">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">TỔNG ĐIỂM</span>
                 <span className="text-2xl font-black text-[#FFCA28] leading-none">{score}</span>
             </div>
          </div>
       )}

       {step === 'input' && (
         <div className="max-w-2xl mx-auto mt-10 md:mt-20 animate-fadeIn">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-t-8" style={{ borderColor: theme.header.includes('orange') ? '#f97316' : theme.header.includes('teal') ? '#0f766e' : '#1d4ed8' }}> 
                <h2 className="text-3xl font-black text-slate-800 mb-2">Tạo phiếu {targetType} AI</h2>
                <p className="text-slate-400 font-medium mb-8">Nhập chủ đề hoặc tải tài liệu để AI soạn đề tự động.</p>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">1. Chọn khối lớp</label>
                        <div className="grid grid-cols-4 gap-3">
                            {['6', '7', '8', '9'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setSelectedClass(g)}
                                    className={`py-3 rounded-xl font-black transition-all ${selectedClass === g ? theme.button + ' text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    Lớp {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">2. Chương học (Sách CTST)</label>
                        <select 
                            value={selectedChapter}
                            onChange={(e) => { setSelectedChapter(e.target.value); setLessonName(''); setIsCustomLesson(false); }}
                            className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        >
                             {gradeChapters?.map(ch => (
                                 <option key={ch} value={ch}>{ch}</option>
                             ))}
                             {!gradeChapters.length && <option>Đang cập nhật danh mục...</option>}
                        </select>
                    </div>

                    <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">3. Tên bài học / Chủ đề</label>
                         {!isCustomLesson && availableLessons.length > 0 ? (
                            <select 
                                value={lessonName}
                                onChange={(e) => {
                                    if (e.target.value === 'CUSTOM') {
                                        setIsCustomLesson(true);
                                        setLessonName('');
                                    } else {
                                        setLessonName(e.target.value);
                                    }
                                }}
                                className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                            >
                                <option value="">-- Chọn bài học --</option>
                                {availableLessons.map(l => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                                <option value="CUSTOM">-- Nhập tên chủ đề khác --</option>
                            </select>
                         ) : (
                             <div className="relative">
                                 <input 
                                    type="text"
                                    value={lessonName}
                                    onChange={(e) => setLessonName(e.target.value)}
                                    placeholder="Ví dụ: Phương trình bậc hai một ẩn..."
                                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 transition-all"
                                    autoFocus={isCustomLesson}
                                 />
                                 {availableLessons.length > 0 && (
                                     <button 
                                        onClick={() => setIsCustomLesson(false)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-bold hover:underline"
                                     >
                                         Chọn danh sách
                                     </button>
                                 )}
                             </div>
                         )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hoặc tải tài liệu gốc (PDF/Ảnh/Word/HTML)</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${attachedFile ? 'bg-blue-50 border-blue-300' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.html,.htm"
                                onChange={handleFileUpload}
                            />
                            {attachedFile ? (
                                <div>
                                    <span className="material-symbols-outlined text-4xl text-blue-600 mb-2">description</span>
                                    <p className="font-bold text-blue-800 px-4 truncate">{attachedFile.name}</p>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setAttachedFile(null); }}
                                        className="text-xs text-red-500 font-bold mt-2 hover:underline"
                                    >
                                        Xóa file
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">cloud_upload</span>
                                    <p className="font-bold text-slate-500 text-sm">Nhấn để chọn file</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ PDF, Ảnh, Word, HTML</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={isLoading || (!lessonName && !attachedFile)}
                        className={`w-full py-5 rounded-[1.5rem] font-black text-white text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isLoading || (!lessonName && !attachedFile) ? 'bg-slate-300 cursor-not-allowed' : theme.button}`}
                    >
                        {isLoading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                AI Đang soạn đề...
                            </>
                        ) : (
                            <>
                                Tạo phiếu bài tập
                                <span className="material-symbols-outlined">auto_awesome</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
         </div>
       )}

       {step === 'worksheet' && worksheetData && (
         <div className="max-w-6xl mx-auto pb-20 animate-fadeIn">
            {/* Header - ADDED PADDING TOP TO AVOID OVERLAP WITH FLOATING SCOREBOARD */}
            <div className={`${theme.header} text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden mb-8 ${!isFileMode ? 'mt-20' : ''}`}>
                <div className="relative z-10 flex flex-col items-center text-center">
                    
                    {/* 1. TEXT THIẾT KẾ (TOP) */}
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-4">
                        Thiết kế bởi: Thầy Tiêu Quang Thạch
                    </p>

                    {/* 2. BADGES (CENTER) */}
                    <div className="flex items-center justify-center gap-3 mb-6 opacity-90">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {targetType}
                        </span>
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest">
                            Lớp {selectedClass}
                        </span>
                    </div>

                    {/* 3. TITLE (CENTER) */}
                    {/* SEPARATE CHAPTER & LESSON NAME */}
                    {(() => {
                        const fullTitle = worksheetData.lessonName || lessonName || "";
                        
                        // Case 1: Active creation mode where we have separate states
                        if (selectedChapter && !isFileMode) {
                             return (
                                <div className="flex flex-col gap-2 items-center">
                                     <p className="text-sm md:text-lg font-bold opacity-80 uppercase tracking-wider border-b border-white/20 pb-2 w-fit">
                                        {selectedChapter}
                                     </p>
                                     <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                                        {lessonName || fullTitle.replace(`${selectedChapter} - `, '')}
                                     </h1>
                                </div>
                             )
                        }

                        // Case 2: Saved data or File mode (Try to split by hyphen if it looks like "Chapter - Lesson")
                        if (fullTitle.includes(" - ")) {
                            const parts = fullTitle.split(" - ");
                            // Heuristic: First part is Chapter if it starts with "Chương"
                            if (parts[0].trim().startsWith("Chương")) {
                                const chap = parts[0];
                                const less = parts.slice(1).join(" - ");
                                return (
                                    <div className="flex flex-col gap-2 items-center">
                                        <p className="text-sm md:text-lg font-bold opacity-80 uppercase tracking-wider border-b border-white/20 pb-2 w-fit">
                                            {chap}
                                        </p>
                                        <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                                            {less}
                                        </h1>
                                    </div>
                                );
                            }
                        }

                        // Case 3: Fallback (Just one line)
                        return (
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                {fullTitle}
                            </h1>
                        );
                    })()}
                </div>
                <span className="material-symbols-outlined absolute -right-10 -bottom-10 text-[200px] text-white/10 rotate-12 pointer-events-none">
                    assignment
                </span>
            </div>

            {/* Content */}
            {isFileMode ? (
                 <div className="h-[80vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[6px] border-slate-200">
                    {renderUploadedFile()}
                 </div>
            ) : (
                <div className="space-y-10">
                    {worksheetData.questions?.map((q: any, idx: number) => {
                        const globalIndex = idx;
                        const status = questionStatus[q.id];
                        const isLocked = lockedQuestions[q.id];
                        const userAnswer = userAnswers[q.id];
                        const isExplainVisible = showExplanation[q.id];
                        const isHintVisible = visibleHints[q.id];

                        // Border Color based on status
                        let borderColor = 'border-slate-200';
                        if (status === 'correct') borderColor = 'border-green-500 ring-4 ring-green-100 bg-green-50';
                        if (status === 'wrong') borderColor = 'border-red-500 ring-4 ring-red-100 bg-red-50';

                        return (
                            <div key={q.id} className={`bg-white rounded-[2rem] p-8 border-4 ${borderColor} shadow-lg relative overflow-hidden transition-all duration-300`}>
                                {/* Question Badge */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="bg-[#FFCA28] text-slate-900 font-black text-xl px-5 py-2 rounded-xl shadow-md border-2 border-orange-300">
                                        Câu {globalIndex + 1}
                                    </span>
                                    <span className="text-slate-400 font-bold uppercase text-sm tracking-wider bg-slate-100 px-3 py-1 rounded-lg">
                                        {q.level || 'Thông hiểu'}
                                    </span>
                                     {/* Feedback Icon */}
                                    {status === 'correct' && <span className="ml-auto material-symbols-outlined text-4xl text-green-600 animate-bounce">check_circle</span>}
                                    {status === 'wrong' && <span className="ml-auto material-symbols-outlined text-4xl text-red-600 animate-pulse">cancel</span>}
                                </div>

                                {/* Content - WRAPPED IN .worksheet-content to trigger Styles */}
                                <div className="worksheet-content text-3xl font-medium text-slate-800 mb-8 leading-relaxed font-montserrat">
                                    <MathJax>{q.question}</MathJax>
                                </div>

                                {/* Interaction Area */}
                                <div className="mt-6">
                                    {q.type === 'multiple_choice' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {q.options?.map((opt: string, i: number) => {
                                                const label = String.fromCharCode(65 + i);
                                                const isSelected = userAnswer === label;
                                                
                                                // STRIP PREFIX: "A. ", "A.", "1.", "A)", etc.
                                                const cleanOpt = opt.replace(/^[A-Dà-ỹ0-9]+(?:\.|:|\))\s+/, '');
                                                
                                                let btnClass = "text-left p-5 rounded-2xl border-4 text-xl font-bold transition-all flex items-start gap-4 ";
                                                if (isSelected && status === 'correct') btnClass += "border-green-500 bg-green-200 text-green-900";
                                                else if (isSelected && status === 'wrong') btnClass += "border-red-500 bg-red-200 text-red-900";
                                                else if (isLocked && !isSelected) btnClass += "border-slate-100 opacity-50"; 
                                                else btnClass += "border-slate-100 hover:border-[#FFCA28] hover:bg-yellow-50 hover:scale-[1.02] text-slate-700 bg-slate-50";

                                                return (
                                                    <button 
                                                        key={i} 
                                                        disabled={isLocked}
                                                        // CRITICAL FIX: Pass 'options' array to handle cases where AI returns full answer text instead of 'A', 'B'
                                                        onClick={() => handleImmediateCheck(q.id, label, 'multiple_choice', q.correctAnswer, q.options)}
                                                        className={btnClass}
                                                    >
                                                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black border-2 ${isSelected ? 'border-transparent bg-white/50' : 'border-slate-300 bg-white'}`}>{label}</span>
                                                        <div className="flex-1 pt-1"><MathJax inline>{cleanOpt}</MathJax></div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {q.type === 'true_false' && (
                                        <div className="flex gap-8">
                                            {["Đúng", "Sai"].map(opt => (
                                                <button
                                                    key={opt}
                                                    disabled={isLocked}
                                                    onClick={() => handleImmediateCheck(q.id, opt, 'true_false', q.correctAnswer)}
                                                    className={`flex-1 py-6 text-2xl font-black uppercase tracking-[0.2em] rounded-3xl border-4 transition-all shadow-md active:scale-95
                                                        ${userAnswer === opt 
                                                            ? (status === 'correct' ? 'bg-green-500 border-green-600 text-white' : 'bg-red-500 border-red-600 text-white')
                                                            : (isLocked ? 'opacity-40 border-slate-200' : 'border-slate-200 text-slate-500 hover:border-[#FFCA28] hover:text-[#FFCA28] bg-white')
                                                        }
                                                    `}
                                                >
                                                    <MathJax inline>{opt}</MathJax>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {(q.type === 'short_answer' || q.type === 'application') && (
                                        <div className="flex flex-col gap-4">
                                            <input 
                                                type="text"
                                                disabled={isLocked}
                                                value={userAnswer || ''}
                                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                                placeholder="Nhập đáp án..."
                                                className={`w-full p-6 text-3xl font-bold border-4 rounded-2xl outline-none transition-all placeholder:text-slate-300
                                                    ${status === 'correct' ? 'border-green-500 text-green-700 bg-green-50' : (status === 'wrong' ? 'border-red-500 text-red-700 bg-red-50' : 'border-slate-300 focus:border-[#FFCA28] focus:bg-yellow-50')}
                                                `}
                                            />
                                            {!isLocked && (
                                                <button
                                                    disabled={!userAnswer}
                                                    onClick={() => handleImmediateCheck(q.id, userAnswer || '', 'short_answer', q.correctAnswer)}
                                                    className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-wider shadow-lg transition-all
                                                        bg-[#FFCA28] text-slate-900 hover:bg-yellow-400 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                                                    `}
                                                >
                                                    XÁC NHẬN
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* LOGIC CHO PHIẾU TỰ LUYỆN: GỢI Ý XEM TRƯỚC KHI LÀM */}
                                    {isSelfPractice && q.explanation && (
                                        <div className="mt-6 border-t-2 border-slate-100 pt-4 animate-fadeIn">
                                            <button 
                                                onClick={() => setVisibleHints(prev => ({...prev, [q.id]: !prev[q.id]}))}
                                                className="bg-yellow-50 text-yellow-700 px-5 py-3 rounded-2xl font-black text-sm hover:bg-yellow-100 transition-all flex items-center gap-2 shadow-sm border border-yellow-200"
                                            >
                                                <span className="material-symbols-outlined text-xl">{isHintVisible ? 'lightbulb' : 'lightbulb_outline'}</span>
                                                {isHintVisible ? 'Ẩn gợi ý' : 'Gợi ý làm bài'}
                                            </button>
                                            
                                            {isHintVisible && (
                                                <div className="mt-4 bg-yellow-50/50 p-6 rounded-2xl border border-yellow-200/50">
                                                    <p className="font-bold text-yellow-600 uppercase text-xs mb-2 tracking-widest">Hướng dẫn giải chi tiết</p>
                                                    <div className="text-lg text-slate-700 leading-relaxed font-medium">
                                                        <MathJax>{q.explanation}</MathJax>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 italic mt-3">* Gợi ý này giúp em tự tư duy, hãy chọn đáp án sau khi đã hiểu nhé.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* LOGIC CHO PHIẾU LUYỆN TẬP (Mặc định): XEM KẾT QUẢ SAU KHI LÀM */}
                                    {!isSelfPractice && isLocked && (
                                        <div className="mt-6 border-t-2 border-slate-100 pt-4 animate-fadeIn">
                                            {!isExplainVisible ? (
                                                <button 
                                                    onClick={() => setShowExplanation(prev => ({...prev, [q.id]: true}))}
                                                    className="text-blue-600 font-bold text-lg hover:underline flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined">visibility</span> Xem kết quả
                                                </button>
                                            ) : (
                                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                                    <p className="font-bold text-slate-500 uppercase text-xs mb-2">Đáp án đúng</p>
                                                    <div className="text-2xl font-black text-blue-600 mb-4">
                                                        <MathJax inline>{q.correctAnswer}</MathJax>
                                                    </div>
                                                    {q.explanation && (
                                                        <>
                                                            <p className="font-bold text-slate-500 uppercase text-xs mb-2">Giải thích chi tiết</p>
                                                            <div className="text-lg text-slate-700"><MathJax>{q.explanation}</MathJax></div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Actions Footer */}
            {!isFileMode && (
                <div className="mt-10 flex flex-col items-center gap-6">
                    <div className="flex flex-wrap justify-center gap-4 w-full">
                        <button
                            onClick={onBack}
                            className={`px-8 py-4 rounded-2xl font-black text-white text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 ${theme.button}`}
                        >
                            <span className="material-symbols-outlined">flag</span>
                            Hoàn thành bài tập
                        </button>

                        <button
                            onClick={resetGrading}
                            className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all flex items-center gap-3"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                            Làm lại
                        </button>
                        
                        {/* Save Button for Teachers with Effect */}
                        {userRole === 'giaoVien' && (
                             <button
                                onClick={handleSaveToLibrary}
                                disabled={isSaving || isSaved}
                                className={`px-8 py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center gap-3 min-w-[160px] justify-center
                                    ${isSaved 
                                        ? 'bg-green-500 text-white animate-pop cursor-default shadow-green-200' 
                                        : (isSaving ? 'bg-slate-300 text-white cursor-wait' : 'bg-emerald-500 text-white hover:bg-emerald-600')
                                    }
                                `}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        <span>Đang lưu...</span>
                                    </>
                                ) : isSaved ? (
                                    <>
                                        <span className="material-symbols-outlined font-bold">check_circle</span>
                                        <span>Đã lưu!</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">save</span>
                                        <span>Lưu phiếu</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
         </div>
       )}
    </div>
    </MathJaxContext>
  );
};

export default SmartWorksheet;
