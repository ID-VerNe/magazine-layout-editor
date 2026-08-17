// 双栏版式相关数值的防御性钳制。
// UI 滑块已限制范围，但旧数据 / 继承 / 序列化恢复可能越界，
// 越界会导致 grid 列宽为负或字号为 0/负数，破坏整页布局，因此渲染前统一兜底。

const clampToRange = (value: number | undefined, min: number, max: number, fallback: number): number => {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

// 英文栏占比，UI 范围 50~80，默认 64
export const clampSplitRatio = (ratio?: number): number => clampToRange(ratio, 50, 80, 64);

// 语种间相对字号平衡（可正负），UI 范围 -5~5，默认 0
export const clampFontBalance = (balance?: number): number => clampToRange(balance, -5, 5, 0);