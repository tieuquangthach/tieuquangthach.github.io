import React from 'react';

interface QuizFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const QuizForm: React.FC<QuizFormProps> = ({ prompt, onPromptChange, onSubmit, isLoading }) => {
  return (
    <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-6">
      <h2 className="text-2xl font-bold text-text-main text-center">Nhập yêu cầu tạo đề</h2>
      
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-text-muted mb-2">
          Mô tả chi tiết đề kiểm tra bạn muốn tạo.
        </label>
        <textarea
          id="prompt"
          rows={4}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
          placeholder="Ví dụ: tạo 5 câu hỏi về phép cộng phân số cho học sinh lớp 5, mức độ trung bình."
          disabled={isLoading}
          aria-label="Nhập yêu cầu tạo đề"
        />
        <p className="text-xs text-text-muted mt-2">Càng chi tiết, kết quả càng chính xác. Hãy nêu rõ số lượng câu hỏi, chủ đề, độ khó, và đối tượng học sinh.</p>
      </div>


      {/* Nút tạo đề */}
      <button 
        type="submit" 
        disabled={isLoading || !prompt.trim()}
        className="w-full flex justify-center items-center bg-primary text-white font-bold py-3 px-4 rounded-lg hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang tạo đề...
          </>
        ) : "Tạo Đề"}
      </button>
    </form>
  );
};

export default QuizForm;