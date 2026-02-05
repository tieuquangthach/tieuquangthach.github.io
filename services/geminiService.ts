
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

// Hàm làm sạch chuỗi JSON (loại bỏ markdown code blocks)
const cleanJsonString = (str: string) => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const askGemini = async (question: string, imageBase64?: string) => {
  if (!API_KEY) {
    throw new Error("Chưa cấu hình API Key. Vui lòng kiểm tra biến môi trường.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const parts: any[] = [
      { text: `Bạn là một trợ lý ảo hỗ trợ học Toán THCS tại Việt Nam (Lớp 6-9). 
               Hãy trả lời câu hỏi sau một cách dễ hiểu, thân thiện, có ví dụ minh họa nếu cần.
               
               NẾU CÓ HÌNH ẢNH ĐƯỢC CUNG CẤP:
               1. Hãy phân tích kỹ nội dung trong ảnh (đề bài, các bước giải, hoặc biểu đồ).
               2. Nếu người dùng hỏi tìm lỗi sai, hãy kiểm tra từng bước tính toán trong ảnh và chỉ ra chính xác lỗi nằm ở đâu.
               3. Nếu là đề bài, hãy hướng dẫn giải chi tiết từng bước.
               4. Sử dụng định dạng LaTeX (trong dấu $) cho các công thức toán học.
               
               \nCâu hỏi/Yêu cầu của học sinh: ${question}` }
    ];

    if (imageBase64) {
      // Ensure we strip the data URL prefix if present to get just the base64 string
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg', // Gemini handles standard image formats well
          data: base64Data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Sử dụng bản stable
      contents: { role: 'user', parts: parts },
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      },
    });

    return response.text || "Xin lỗi, tôi không thể tìm thấy câu trả lời lúc này.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes('API key')) return "Lỗi: API Key không hợp lệ hoặc bị thiếu.";
    return "Có lỗi xảy ra khi kết nối với trợ lý AI. Vui lòng thử lại sau.";
  }
};

export const generateLessonContent = async (topic: string, grade: string, requirements?: string) => {
  if (!API_KEY) throw new Error("Chưa có API Key. Vui lòng liên hệ quản trị viên.");
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const contextPrompt = requirements 
    ? `Dựa trên các yêu cầu cần đạt sau: "${requirements}", hãy soạn bài giảng cho học sinh lớp ${grade}.`
    : `Hãy soạn thảo nội dung bài học cho chủ đề: "${topic}" dành cho học sinh lớp ${grade} theo chương trình GDPT 2018 (Sách Chân trời sáng tạo).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Sử dụng bản stable cho tốc độ
      contents: `Bạn là một giáo viên chuyên gia Toán THCS tại Việt Nam. 
                 Nhiệm vụ: Soạn bài giảng cho bài: "${topic}" - Lớp ${grade}.
                 ${contextPrompt}
                 
                 Yêu cầu định dạng JSON trả về:
                 1. "chuong": Tên chương chuẩn trong SGK.
                 2. "lyThuyet": Nội dung lý thuyết chi tiết, trình bày khoa học, có ví dụ "Thực hành" và "Vận dụng" như trong sách Chân trời sáng tạo.
                 3. "baiTap": 5 câu trắc nghiệm bám sát mục tiêu "Yêu cầu cần đạt". Các phương án phải gây nhiễu tốt.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lyThuyet: { type: Type.STRING },
            chuong: { type: Type.STRING },
            baiTap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  deBai: { type: Type.STRING },
                  dapAn: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dapAnDung: { type: Type.STRING }
                },
                required: ["deBai", "dapAn", "dapAnDung"]
              }
            }
          },
          required: ["lyThuyet", "chuong", "baiTap"]
        }
      }
    });

    const cleanText = cleanJsonString(response.text || "{}");
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const generateSmartWorksheet = async (
  lessonName: string, 
  className: string, 
  type: string = 'Luyện tập',
  attachedFile?: { base64: string, mimeType: string }
) => {
  if (!API_KEY) throw new Error("Lỗi: Chưa cấu hình API Key cho ứng dụng.");
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const isSelfPractice = type === 'Tự luyện'; 
  const isEssay = type === 'Tự luận';

  // Cấu hình số lượng câu hỏi
  let totalQuestions = 10;
  let part1End = 4;
  let part2Start = 5;
  let part2End = 7;
  let part3Start = 8;
  let part3End = 10;

  if (isSelfPractice) {
    totalQuestions = 20;
    part1End = 8;
    part2Start = 9;
    part2End = 14;
    part3Start = 15;
    part3End = 20;
  } else if (isEssay) {
    // Cấu hình cho Tự luận: Chỉ có phần 3 (Điền đáp án/Trả lời ngắn)
    totalQuestions = 10;
    part1End = 0; // Không có trắc nghiệm
    part2Start = 0;
    part2End = 0; // Không có đúng sai
    part3Start = 1;
    part3End = 10; // Toàn bộ là tự luận ngắn
  }

  // Xây dựng prompt dựa trên việc có file đính kèm hay không
  let sourceInstruction = "";
  let filePart = null;

  if (attachedFile) {
    sourceInstruction = `
    QUAN TRỌNG: NGƯỜI DÙNG ĐÃ ĐÍNH KÈM TÀI LIỆU (PDF/ẢNH/HTML).
    NHIỆM VỤ CỦA BẠN LÀ **CHUYỂN ĐỔI (DIGITIZE)** NỘI DUNG TỪ FILE NÀY THÀNH CẤU TRÚC PHIẾU BÀI TẬP.

    YÊU CẦU TUYỆT ĐỐI VỀ NỘI DUNG:
    1. **Ưu tiên số 1**: Lấy TOÀN BỘ câu hỏi, bài toán có trong file đính kèm.
    2. Nếu file đính kèm là đề thi hoặc danh sách bài tập: Hãy chép lại nguyên văn đề bài, số liệu, hình vẽ (mô tả bằng lời).
    3. **CHỈ KHI** số lượng câu hỏi trong file KHÔNG ĐỦ ${totalQuestions} câu, bạn mới được phép tạo thêm câu hỏi mới. 
       - Câu hỏi tạo thêm phải CÙNG DẠNG, CÙNG CHỦ ĐỀ và CÙNG ĐỘ KHÓ với các câu trong file.
    `;
    
    const base64Data = attachedFile.base64.includes(',') ? attachedFile.base64.split(',')[1] : attachedFile.base64;
    
    // Xử lý loại file
    if (attachedFile.mimeType.includes('pdf') || attachedFile.mimeType.startsWith('image/')) {
        filePart = {
            inlineData: {
                mimeType: attachedFile.mimeType,
                data: base64Data
            }
        };
    } else if (attachedFile.mimeType.includes('html') || attachedFile.mimeType.includes('text')) {
        try {
            const decodedText = atob(base64Data);
            filePart = { text: `NỘI DUNG FILE ĐÍNH KÈM (HTML/TEXT):\n\n${decodedText}` };
        } catch (e) {
            filePart = { text: "Có file đính kèm nhưng không đọc được nội dung text." };
        }
    } else {
        filePart = {
            inlineData: {
                mimeType: 'application/pdf', 
                data: base64Data
            }
        };
        sourceInstruction += "\n(Lưu ý: File này có thể là Word/Docx, hãy cố gắng trích xuất văn bản từ binary data).";
    }

  } else {
    sourceInstruction = `Hãy tự tạo ra các câu hỏi dựa trên chủ đề bài học: "${lessonName}" trong sách giáo khoa Toán lớp ${className}.`;
  }

  let structurePrompt = "";
  
  if (isEssay) {
      structurePrompt = `
      YÊU CẦU CẤU TRÚC ĐỀ TỰ LUẬN (BẮT BUỘC ${totalQuestions} CÂU):
      - TOÀN BỘ ${totalQuestions} câu hỏi đều là dạng "short_answer" (Trả lời ngắn).
      - KHÔNG ĐƯỢC tạo câu hỏi trắc nghiệm (A,B,C,D) hoặc Đúng/Sai.
      - MỨC ĐỘ YÊU CẦU: CHỈ TẬP TRUNG vào 2 mức độ cao sau (TUYỆT ĐỐI KHÔNG tạo câu hỏi mức độ Nhận biết/Thông hiểu):
        1. Vận dụng: Áp dụng kiến thức giải bài tập tính toán đòi hỏi tư duy.
        2. Vận dụng thực tế: Bài toán có bối cảnh thực tế đời sống, giải quyết vấn đề thực tiễn.
      - Hướng dẫn giải (explanation) phải chi tiết từng bước.
      `;
  } else {
      structurePrompt = `
      YÊU CẦU CẤU TRÚC ĐỀ (BẮT BUỘC ${totalQuestions} CÂU):
      1. PHẦN I (Câu 1-${part1End}): TRẮC NGHIỆM (4 lựa chọn A,B,C,D).
      2. PHẦN II (Câu ${part2Start}-${part2End}): TRẮC NGHIỆM ĐÚNG/SAI (Chọn "Đúng" hoặc "Sai").
      3. PHẦN III (Câu ${part3Start}-${part3End}): ĐIỀN ĐÁP ÁN (Trả lời ngắn).
      `;
  }

  const promptText = `Bạn là giáo viên Toán chương trình GDPT 2018.
    Hãy tạo một "Phiếu Bài Tập ${type}".
    ${sourceInstruction}

    ${structurePrompt}

    YÊU CẦU ĐẶC BIỆT VỀ ĐỊNH DẠNG (FORMATTING):
    1. CÔNG THỨC TOÁN: Dùng LaTeX trong dấu $ (Ví dụ: $x^2 + 2x + 1 = 0$).
    2. HỆ PHƯƠNG TRÌNH: Sử dụng môi trường cases của LaTeX. Ví dụ: $\\begin{cases} x + y = 2 \\\\ x - y = 0 \\end{cases}$. Chú ý escape dấu backslash.
    3. BẢNG SỐ LIỆU: Nếu câu hỏi có bảng thống kê, bảng tần số, HÃY TRẢ VỀ MÃ HTML <table> (không dùng Markdown Table).
       - Ví dụ: <table border="1"><tr><th>Giá trị</th><th>Tần số</th></tr>...</table>
    4. HÌNH VẼ HÌNH HỌC: Nếu câu hỏi cần hình vẽ minh họa (tam giác, đường tròn, đồ thị...), HÃY TỰ SINH MÃ SVG (Scalable Vector Graphics) và chèn vào đầu nội dung câu hỏi ("question").
       - Mã <svg> phải đơn giản, rõ ràng, có kích thước width="300" height="200" (hoặc phù hợp).
       - Ví dụ: <svg width="200" height="200">...</svg> Cho tam giác ABC...
    
    YÊU CẦU KHÁC:
    - Trong mảng "options", CHỈ ĐƯA VÀO NỘI DUNG ĐÁP ÁN. KHÔNG BAO GỒM "A.", "B." ở đầu.

    Định dạng JSON yêu cầu:
    {
      "lessonName": "${lessonName}", // Nếu lấy từ file, hãy dùng tên đề bài trong file
      "questions": [
        { 
           "id": 1, 
           "type": "multiple_choice", // "true_false", "short_answer"
           "level": "Thông hiểu", // "Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng thực tế"
           "question": "Nội dung câu hỏi (có thể chứa HTML Table hoặc SVG)...", 
           "options": ["...", "...", "...", "..."], 
           "correctAnswer": "...", 
           "explanation": "..." 
        }
      ]
    }`;

  const parts = [];
  if (filePart) parts.push(filePart);
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Use stable model
      contents: { role: 'user', parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lessonName: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["multiple_choice", "true_false", "short_answer", "application"] },
                  level: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "type", "level", "question", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["lessonName", "questions"]
        }
      }
    });

    const cleanText = cleanJsonString(response.text || "{}");
    const parsedData = JSON.parse(cleanText);
    
    // Validate data integrity
    if (!parsedData.questions || parsedData.questions.length === 0) {
        throw new Error("AI không tạo được câu hỏi nào. Vui lòng thử lại với nội dung khác.");
    }

    return parsedData;
  } catch (error: any) {
    console.error("AI Worksheet Generation Error:", error);
    // Enhance error message for user
    if (error.message?.includes('API key')) throw new Error("Lỗi cấu hình: Thiếu API Key.");
    if (error.message?.includes('Candidate was blocked')) throw new Error("Nội dung bị chặn bởi bộ lọc an toàn AI.");
    throw new Error("Lỗi tạo đề: " + (error.message || "Không xác định"));
  }
};
