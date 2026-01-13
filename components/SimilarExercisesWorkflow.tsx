
import React, { useState, useRef } from 'react';
import { generateSimilarQuizFromFile } from '../services/geminiService';
import { QuizQuestion } from '../types';
import QuizDisplay from './QuizDisplay';

const SimilarExercisesWorkflow: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MEDIA_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const WORD_MIME_TYPES = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const isSupported = MEDIA_MIME_TYPES.includes(selectedFile.type) || WORD_MIME_TYPES.includes(selectedFile.type);
    if (!isSupported) {
      setError("Định dạng tệp không được hỗ trợ. Vui lòng sử dụng tệp PDF, Hình ảnh hoặc Word (.docx).");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (!isLoading) fileInputRef.current?.click();
  };

  const handleStartProcess = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      // Kiểm tra API Key
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      let generatedQuestions: QuizQuestion[] = [];
      if (WORD_MIME_TYPES.includes(file.type)) {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = (window as any).mammoth;
        if (!mammoth) throw new Error("Thư viện trích xuất Word chưa sẵn sàng.");
        const result = await mammoth.extractRawText({ arrayBuffer });
        const textContent = result.value;
        if (!textContent.trim()) throw new Error("Không thể trích xuất nội dung từ tệp Word này.");
        generatedQuestions = await generateSimilarQuizFromFile({ text: textContent });
      } else {
        const reader = new FileReader();
        const fileDataPromise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const base64Data = await fileDataPromise;
        generatedQuestions = await generateSimilarQuizFromFile({ data: base64Data, mimeType: file.type });
      }
      setQuestions(generatedQuestions);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("entity was not found")) {
        setError("API Key không hợp lệ hoặc đã hết hạn. Vui lòng chọn lại.");
        if (window.aistudio) await window.aistudio.openSelectKey();
      } else {
        setError(err.message || "Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (questions.length > 0) {
    return (
      <div className="p-4 md:p-8 animate-fade-in">
        <QuizDisplay 
          questions={questions}
          matrix={[]}
          specification={[]}
          onBack={() => setQuestions([])}
          initialInfo={{
            title: "Đề bài tương tự",
            subject: "Toán",
            duration: "90",
            grade: "9"
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in">
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3 animate-fade-in">
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <div 
        className={`relative group cursor-pointer transition-all duration-500 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center p-12 md:p-20 bg-white shadow-xl shadow-blue-900/5 ${
          isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-200 hover:border-primary/50'
        } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept=".pdf,.docx,image/*"
          disabled={isLoading}
        />
        
        <div className={`w-24 h-24 md:w-32 md:h-32 bg-blue-50 rounded-full flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500 ${isLoading ? 'animate-pulse' : ''}`}>
          {isLoading ? (
            <svg className="w-10 h-10 md:w-14 md:h-14 text-primary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-10 h-10 md:w-14 md:h-14 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-wider">
            {isLoading ? 'ĐANG XỬ LÝ TỆP...' : (file ? file.name : 'KÉO THẢ TỆP VÀO ĐÂY')}
          </h3>
          <p className="text-gray-400 text-sm font-medium">
            Hỗ trợ <span className="text-primary font-bold">Hình ảnh, PDF</span> hoặc <span className="text-primary font-bold">Word (.docx)</span>
          </p>
          <p className="text-gray-300 text-xs uppercase tracking-widest font-bold">
            Kích thước tối đa 10MB
          </p>
        </div>

        {file && !isLoading && (
          <button 
            onClick={(e) => { e.stopPropagation(); setFile(null); }}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-12 flex justify-center">
        <button 
          onClick={handleStartProcess}
          disabled={!file || isLoading}
          className={`group relative flex items-center justify-center gap-5 px-16 py-7 rounded-[3rem] font-black text-2xl uppercase tracking-[0.2em] transition-all duration-500 shadow-[0_25px_50px_-12px_rgba(46,67,150,0.5)] shimmer-btn ${
            file && !isLoading
              ? 'text-white scale-105 hover:scale-110 active:scale-95 animate-float border-2 border-white/20' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              ĐANG BIÊN SOẠN...
            </>
          ) : (
            <>
              <svg className={`w-9 h-9 transition-transform group-hover:rotate-12 group-hover:scale-125 ${file ? 'text-white drop-shadow-md' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14H11V21L20 10H13Z" />
              </svg>
              BẮT ĐẦU TẠO ĐỀ
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SimilarExercisesWorkflow;
