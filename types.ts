
export interface QuizQuestion {
  id: string; // Thêm ID để quản lý trạng thái local
  cauHoi: string;
  dapAn: string;
  loaiCauHoi: QuestionType;
  huongDanChamDiem: string;
  drawingCode?: string; // Mã JS để vẽ hình học nếu cần
  metadata?: {
    chuDe: string;
    noiDung: string;
    yeuCauCanDat: string;
    mucDo: CognitiveLevelDoc;
  };
}

export const COGNITIVE_LEVELS_DOC = ['Biết', 'Hiểu', 'Vận dụng'] as const;
export type CognitiveLevelDoc = typeof COGNITIVE_LEVELS_DOC[number];
export type LevelCountsDoc = Record<CognitiveLevelDoc, number>;

export const QUESTION_TYPES = ['Nhiều lựa chọn', 'Đúng - Sai', 'Trả lời ngắn', 'Tự luận'] as const;
export type QuestionType = typeof QUESTION_TYPES[number];


export interface MatrixRow {
  id: string; 
  topic: string;
  knowledgeUnit: string;
  learningOutcome?: string; // Trường mới: Yêu cầu cần đạt
  percentage: number;
  counts: Record<QuestionType, LevelCountsDoc>;
}

export type QuizMatrix = MatrixRow[];

export interface SpecificationItem {
  chuDe: string;
  noiDung: string;
  yeuCauCanDat: string;
  loaiCauHoi: QuestionType;
  mucDo: CognitiveLevelDoc;
  soLuong: number;
}

export type QuizSpecification = SpecificationItem[];

export interface Theme {
  name: string;
  colors: {
    'primary': string;
    'secondary': string;
    'gradient-from': string;
    'gradient-to': string;
    'text-main': string;
    'text-muted': string;
    'text-accent': string;
  };
}

export const themes: Theme[] = [
  {
    name: 'Mặc định',
    colors: {
      'primary': '#1e3a8a', // blue-900
      'secondary': '#15803d', // green-700
      'gradient-from': '#e0f2fe', // sky-100
      'gradient-to': '#eef2ff', // indigo-50
      'text-main': '#020617', // slate-950 (Đen đậm sắc nét)
      'text-muted': '#334155', // slate-700
      'text-accent': '#1d4ed8', // blue-700
    },
  },
  {
    name: 'Hoàng hôn',
    colors: {
      'primary': '#9a3412', // orange-800
      'secondary': '#991b1b', // red-800
      'gradient-from': '#fff7ed', // orange-50
      'gradient-to': '#fef2f2', // red-50
      'text-main': '#2a0a04', // stone-950 (Nâu đen đậm)
      'text-muted': '#44403c', // stone-700
      'text-accent': '#ea580c', // orange-600
    },
  },
  {
    name: 'Đại dương',
    colors: {
      'primary': '#075985', // sky-800
      'secondary': '#0f766e', // teal-700
      'gradient-from': '#f0f9ff', // sky-50
      'gradient-to': '#e0f2fe', // sky-100
      'text-main': '#082f49', // sky-950 (Xanh đen đậm)
      'text-muted': '#334155', // slate-700
      'text-accent': '#0284c7', // sky-600
    },
  },
  {
    name: 'Rừng xanh',
    colors: {
      'primary': '#14532d', // green-900
      'secondary': '#3f6212', // lime-800
      'gradient-from': '#f0fdf4', // green-50
      'gradient-to': '#ecfccb', // lime-100
      'text-main': '#022c22', // emerald-950 (Xanh lá đen đậm)
      'text-muted': '#166534', // green-700
      'text-accent': '#15803d', // green-700
    },
  },
];

export const QUESTION_TYPE_POINTS: Record<QuestionType, number> = {
  'Nhiều lựa chọn': 0.25,
  'Đúng - Sai': 1.0,
  'Trả lời ngắn': 0.5,
  'Tự luận': 1.0,
};
