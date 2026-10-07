export interface SurveyAppearance {
  themeColor: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
  buttonShape: 'rounded' | 'square' | 'pill';
  showProgress: boolean;
  showQuestionNumber: boolean;
}

export const defaultAppearance: SurveyAppearance = {
  themeColor: '#f43f50',
  backgroundColor: '#ffffff',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 14,
  buttonShape: 'rounded',
  showProgress: true,
  showQuestionNumber: true,
};

export const themeColors = [
  { label: '红色', value: '#f43f50' },
  { label: '橙色', value: '#ff7515' },
  { label: '黄色', value: '#eab600' },
  { label: '绿色', value: '#22c55e' },
  { label: '蓝色', value: '#3b82f6' },
  { label: '紫色', value: '#a855f7' },
  { label: '深灰色', value: '#1f2937' },
];

export const backgroundColors = [
  { label: '白色', value: '#ffffff' },
  { label: '浅灰色', value: '#f8fafc' },
  { label: '灰色', value: '#f3f4f6' },
  { label: '浅粉色', value: '#fff1f2' },
  { label: '浅蓝色', value: '#eff6ff' },
  { label: '浅绿色', value: '#f0fdf4' },
];

export const buttonRadius = { rounded: 6, square: 0, pill: 24 };

export const fontFamilyOptions = [
  { label: '系统默认', value: 'system-ui, sans-serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '宋体', value: 'SimSun, serif' },
  { label: '思源黑体', value: '"Source Han Sans SC", "Noto Sans CJK SC", sans-serif' },
];

export const fontSizeOptions = [
  { label: '小', value: 12 },
  { label: '中', value: 14 },
  { label: '大', value: 16 },
  { label: '超大号', value: 18 },
];
