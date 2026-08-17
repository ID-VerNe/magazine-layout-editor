// 跨模板复用的设计 Token 常量。
// 目的：把散落在各模板 / 组件里相同的默认值收敛为单一来源，
// 后续调整字体回退或默认主色时只需改这里。

// 字体回退（与 SplitLayout 的 DEFAULT_* 对齐，作为唯一权威来源）
export const DEFAULT_FONTS = {
  en: "'Inter', sans-serif",
  zh: "'Crimson Pro', serif",
} as const;

// 通用默认色
export const DEFAULT_ACCENT = '#367237'; // 默认强调色（双栏边框/强调块）
export const DEFAULT_PAPER = '#FAF9F4'; // 默认纸张/背景色（页脚、浅色模板底）

// 默认版式尺寸
export const DEFAULT_LINE_HEIGHT = 1.6;
export const DEFAULT_PARAGRAPH_SPACING = 32;