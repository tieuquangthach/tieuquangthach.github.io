
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, QuizMatrix, QuizSpecification, SpecificationItem } from '../types';

const parseJsonResponse = <T>(jsonText: string): T => {
  try {
    const data = JSON.parse(jsonText.replace(/```json|```/g, '').trim());
    return data as T;
  } catch (error) {
    console.error("Lỗi khi phân tích JSON:", jsonText, error);
    throw new Error("Phản hồi từ AI không phải là định dạng JSON hợp lệ.");
  }
};

export const generateSpecification = async (matrix: QuizMatrix, selectedClass: string, selectedSubject: string): Promise<QuizSpecification> => {
  // Luôn lấy API_KEY mới nhất từ môi trường (Vercel injection)
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key chưa được cấu hình. Vui lòng kết nối API ở góc phải màn hình.");
  
  const ai = new GoogleGenAI({ apiKey });
  const matrixString = JSON.stringify(matrix, null, 2);
  const prompt = `
    Bạn là chuyên gia khảo thí. Hãy chuyển ma trận sau thành bảng đặc tả chi tiết cho môn ${selectedSubject} lớp ${selectedClass}:
    ${matrixString}

    YÊU CẦU:
    1. LaTeX cho ký hiệu toán ($x, y, \pi$,...).
    2. Xuất JSON mảng các đối tượng SpecificationItem.
    3. Giữ nguyên các nội dung kiến thức từ ma trận.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              chuDe: { type: Type.STRING },
              noiDung: { type: Type.STRING },
              yeuCauCanDat: { type: Type.STRING },
              loaiCauHoi: { type: Type.STRING },
              mucDo: { type: Type.STRING },
              soLuong: { type: Type.INTEGER },
            },
            required: ["chuDe", "noiDung", "yeuCauCanDat", "loaiCauHoi", "mucDo", "soLuong"],
          }
        }
      }
    });
    return parseJsonResponse<SpecificationItem[]>(response.text.trim());
  } catch (error) {
    console.error("Lỗi khi tạo bảng đặc tả:", error);
    throw error;
  }
};

export const generateQuizFromSpec = async (specification: QuizSpecification, selectedClass: string, selectedSubject: string): Promise<QuizQuestion[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key chưa được cấu hình. Vui lòng kết nối API ở góc phải màn hình.");

  const ai = new GoogleGenAI({ apiKey });
  const specString = JSON.stringify(specification, null, 2);
  const prompt = `
    Soạn đề kiểm tra ${selectedSubject} lớp ${selectedClass} theo đặc tả:
    ${specString}

    QUY TẮC:
    1. Lời giải chi tiết step-by-step trong 'huongDanChamDiem'.
    2. LaTeX chuẩn ($ cho inline, $$ cho block). Số thập phân dùng dấu phẩy.
    3. Điền Metadata chính xác theo đặc tả.
    4. Nếu câu hỏi có hình vẽ minh họa (đặc biệt là hình học), hãy cung cấp mã JavaScript để vẽ hình đó lên HTML5 Canvas 2D vào trường 'drawingCode'. 
       Mã vẽ phải sạch, nhận biến 'ctx' (2D context) và 'canvas'. Canvas mặc định 500x300. Hãy vẽ căn giữa, rõ nét, có ký hiệu đỉnh/góc nếu cần.
    5. Trả về mảng JSON QuizQuestion.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              cauHoi: { type: Type.STRING },
              dapAn: { type: Type.STRING },
              loaiCauHoi: { type: Type.STRING },
              huongDanChamDiem: { type: Type.STRING },
              drawingCode: { type: Type.STRING, description: "Mã JS vẽ hình Canvas 2D" },
              metadata: {
                type: Type.OBJECT,
                properties: {
                  chuDe: { type: Type.STRING },
                  noiDung: { type: Type.STRING },
                  yeuCauCanDat: { type: Type.STRING },
                  mucDo: { type: Type.STRING },
                }
              }
            },
            required: ["cauHoi", "dapAn", "loaiCauHoi", "huongDanChamDiem"],
          }
        }
      }
    });
    const qs = parseJsonResponse<QuizQuestion[]>(response.text.trim());
    return qs.map(q => ({ ...q, id: q.id || Math.random().toString(36).substr(2, 9) }));
  } catch (error) {
    console.error("Lỗi khi tạo đề:", error);
    throw error;
  }
};

export const generateSimilarQuizFromFile = async (content: { data?: string, mimeType?: string, text?: string }): Promise<QuizQuestion[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key chưa được cấu hình. Vui lòng kết nối API ở góc phải màn hình.");

  const ai = new GoogleGenAI({ apiKey });
  const promptText = `
    Bạn là chuyên gia giáo dục. Hãy phân tích đề kiểm tra được cung cấp và thực hiện:
    1. Nhận diện các câu hỏi, chủ đề và mức độ kiến thức.
    2. Tạo một bộ đề MỚI gồm 10 câu hỏi có tính chất TƯƠNG TỰ đề gốc (cùng chủ đề, độ khó) nhưng THAY ĐỔI số liệu hoặc nội dung cụ thể.
    3. Đảm bảo sử dụng LaTeX ($...$ hoặc $$...$$) và cung cấp lời giải chi tiết.
    4. Trả về mảng JSON QuizQuestion.
  `;

  const parts: any[] = [];
  if (content.data && content.mimeType) {
    parts.push({ inlineData: { data: content.data, mimeType: content.mimeType } });
  } else if (content.text) {
    parts.push({ text: `Nội dung đề gốc: \n${content.text}` });
  }
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts }],
      config: {
        thinkingConfig: { thinkingBudget: 32000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              cauHoi: { type: Type.STRING },
              dapAn: { type: Type.STRING },
              loaiCauHoi: { type: Type.STRING },
              huongDanChamDiem: { type: Type.STRING },
              drawingCode: { type: Type.STRING },
              metadata: {
                type: Type.OBJECT,
                properties: {
                  chuDe: { type: Type.STRING },
                  noiDung: { type: Type.STRING },
                  mucDo: { type: Type.STRING }
                }
              }
            },
            required: ["cauHoi", "dapAn", "loaiCauHoi", "huongDanChamDiem"]
          }
        }
      }
    });
    const qs = parseJsonResponse<QuizQuestion[]>(response.text.trim());
    return qs.map(q => ({ ...q, id: q.id || Math.random().toString(36).substr(2, 9) }));
  } catch (error) {
    console.error("Lỗi khi tạo đề tương tự:", error);
    throw error;
  }
};

export const regenerateSingleQuestion = async (oldQuestion: QuizQuestion, selectedClass: string, selectedSubject: string): Promise<QuizQuestion> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key chưa được cấu hình. Vui lòng kết nối API ở góc phải màn hình.");

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Tạo 1 câu hỏi ${selectedSubject} ${selectedClass} mới (KHÁC câu cũ: ${oldQuestion.cauHoi}) cùng tiêu chí:
    - Loại: ${oldQuestion.loaiCauHoi}
    - Chủ đề: ${oldQuestion.metadata?.chuDe}
    - Mức độ: ${oldQuestion.metadata?.mucDo}
    
    Yêu cầu: LaTeX chuẩn, lời giải chi tiết. 
    Nếu có hình vẽ minh họa, cung cấp mã JS vẽ Canvas vào 'drawingCode'.
    JSON duy nhất.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 8000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            cauHoi: { type: Type.STRING },
            dapAn: { type: Type.STRING },
            loaiCauHoi: { type: Type.STRING },
            huongDanChamDiem: { type: Type.STRING },
            drawingCode: { type: Type.STRING },
            metadata: {
              type: Type.OBJECT,
              properties: {
                chuDe: { type: Type.STRING },
                noiDung: { type: Type.STRING },
                yeuCauCanDat: { type: Type.STRING },
                mucDo: { type: Type.STRING },
              }
            }
          },
          required: ["cauHoi", "dapAn", "loaiCauHoi", "huongDanChamDiem"]
        }
      }
    });
    const newQ = parseJsonResponse<QuizQuestion>(response.text.trim());
    return { ...newQ, id: oldQuestion.id, metadata: oldQuestion.metadata };
  } catch (error) {
    console.error("Lỗi khi tạo lại câu hỏi:", error);
    throw error;
  }
};
