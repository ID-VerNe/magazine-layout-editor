import { describe, it, expect } from 'vitest';
import { clampSplitRatio, clampFontBalance } from './layoutMath';

describe('clampSplitRatio', () => {
  it('范围内 64 原样返回', () => {
    expect(clampSplitRatio(64)).toBe(64);
  });

  it('边界下限 50 原样返回', () => {
    expect(clampSplitRatio(50)).toBe(50);
  });

  it('边界上限 80 原样返回', () => {
    expect(clampSplitRatio(80)).toBe(80);
  });

  it('低于 50 的 10 被钳到 50', () => {
    expect(clampSplitRatio(10)).toBe(50);
  });

  it('值为 0 被钳到 50', () => {
    expect(clampSplitRatio(0)).toBe(50);
  });

  it('负数被钳到 50', () => {
    expect(clampSplitRatio(-10)).toBe(50);
  });

  it('负无穷是非有限值，返回默认 64', () => {
    expect(clampSplitRatio(-Infinity)).toBe(64);
  });

  it('高于 80 的 120 被钳到 80', () => {
    expect(clampSplitRatio(120)).toBe(80);
  });

  it('正无穷是非有限值，返回默认 64', () => {
    expect(clampSplitRatio(Infinity)).toBe(64);
  });

  it('undefined 返回默认 64', () => {
    expect(clampSplitRatio(undefined)).toBe(64);
  });

  it('NaN 返回默认 64', () => {
    expect(clampSplitRatio(NaN)).toBe(64);
  });
});

describe('clampFontBalance', () => {
  it('范围内 0 原样返回', () => {
    expect(clampFontBalance(0)).toBe(0);
  });

  it('边界下限 -5 原样返回', () => {
    expect(clampFontBalance(-5)).toBe(-5);
  });

  it('边界上限 5 原样返回', () => {
    expect(clampFontBalance(5)).toBe(5);
  });

  it('低于 -5 的 -10 被钳到 -5', () => {
    expect(clampFontBalance(-10)).toBe(-5);
  });

  it('极小的 -999 被钳到 -5', () => {
    expect(clampFontBalance(-999)).toBe(-5);
  });

  it('高于 5 的 8 被钳到 5', () => {
    expect(clampFontBalance(8)).toBe(5);
  });

  it('很大的 50 被钳到 5', () => {
    expect(clampFontBalance(50)).toBe(5);
  });

  it('undefined 返回默认 0', () => {
    expect(clampFontBalance(undefined)).toBe(0);
  });

  it('NaN 返回默认 0', () => {
    expect(clampFontBalance(NaN)).toBe(0);
  });

  it('正无穷返回默认 0', () => {
    expect(clampFontBalance(Infinity)).toBe(0);
  });

  it('负无穷返回默认 0', () => {
    expect(clampFontBalance(-Infinity)).toBe(0);
  });
});