
import React, { useState, useCallback } from 'react';
import { QuizMatrix, MatrixRow, QuizSpecification, QuizQuestion, QUESTION_TYPES, COGNITIVE_LEVELS_DOC, LevelCountsDoc, QuestionType } from '../types';
import { generateSpecification, generateQuizFromSpec } from '../services/geminiService';
import Stepper from './Stepper';
import GeneralInfoForm from './GeneralInfoForm';
import MatrixCreator from './MatrixCreator';
import QuizDisplay from './QuizDisplay';

const STEPS = ['Thông tin chung', 'THIẾT KẾ MA TRẬN, ĐẶC TẢ', 'Đề kiểm tra'];

const MatrixWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [matrix, setMatrix] = useState<QuizMatrix>([]);
  const [specification, setSpecification] = useState<QuizSpecification>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // States cho Thông tin chung
  const [selectedClass, setSelectedClass] = useState<string>('6');
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán');
  const [quizTitle, setQuizTitle] = useState<string>('Kiểm tra giữa kỳ I');
  const [quizDuration, setQuizDuration] = useState<string>('90');

  const handleGenerateFullQuiz = useCallback(async () => {
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

      const nonEmptyRows = matrix.filter(row => {
          if (!row.topic.trim() || !row.knowledgeUnit.trim()) return false;
          return QUESTION_TYPES.some(qType => 
              COGNITIVE_LEVELS_DOC.some(level => (row.counts[qType]?.[level] || 0) > 0)
          );
      });

      if (nonEmptyRows.length === 0) {
        throw new Error("Ma trận không hợp lệ. Vui lòng thêm ít nhất một nội dung và câu hỏi.");
      }

      // Bước 1 ngầm: Tạo đặc tả
      const spec = await generateSpecification(nonEmptyRows, selectedClass, selectedSubject);
      setSpecification(spec);
      
      // Bước 2: Tạo đề từ đặc tả vừa tạo
      const generatedQuestions = await generateQuizFromSpec(spec, selectedClass, selectedSubject);
      setQuestions(generatedQuestions);
      
      setCurrentStep(3); // Chuyển đến bước Xem đề (bước 3 trong 3 bước)
    } catch (err: any) {
      if (err.message?.includes("entity was not found")) {
        setError("API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng kết nối lại.");
        if (window.aistudio) await window.aistudio.openSelectKey();
      } else {
        setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra trong quá trình tạo đề.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [matrix, selectedClass, selectedSubject]);

  const handleStepClick = (stepIndex: number) => {
    // Chỉ cho phép chuyển sang bước xem đề nếu đã có câu hỏi
    if (stepIndex === 3 && questions.length === 0) return;
    setCurrentStep(stepIndex);
  };

  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    setMatrix([]);
    setQuestions([]);
    setSpecification([]);
  };

  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    setMatrix([]);
    setQuestions([]);
    setSpecification([]);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <GeneralInfoForm 
            subject={selectedSubject}
            grade={selectedClass}
            title={quizTitle}
            duration={quizDuration}
            onSubjectChange={handleSubjectChange}
            onGradeChange={handleClassChange}
            onTitleChange={setQuizTitle}
            onDurationChange={setQuizDuration}
            onNext={() => setCurrentStep(2)}
          />
        );
      case 2:
        return (
          <MatrixCreator 
            matrix={matrix} 
            setMatrix={setMatrix} 
            onSubmit={handleGenerateFullQuiz} 
            isLoading={isLoading} 
            selectedClass={selectedClass}
            onClassChange={handleClassChange}
            selectedSubject={selectedSubject}
            onSubjectChange={handleSubjectChange}
            hasGeneratedQuiz={questions.length > 0}
            onReturnToQuiz={() => setCurrentStep(3)}
          />
        );
      case 3:
        return (
          <QuizDisplay 
            questions={questions} 
            matrix={matrix}
            specification={specification}
            onBack={() => setCurrentStep(2)} 
            onStartOver={handleGenerateFullQuiz} 
            isLoading={isLoading} 
            initialInfo={{
              title: quizTitle,
              subject: selectedSubject,
              duration: quizDuration,
              grade: selectedClass
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <Stepper 
        currentStep={currentStep} 
        steps={STEPS} 
        onStepClick={handleStepClick}
      />
       {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Lỗi!</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
      )}
      {renderCurrentStep()}
    </div>
  );
};

export default MatrixWorkflow;
