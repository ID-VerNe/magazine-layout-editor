import { describe, it, expect } from 'vitest';
import { resolveCoverContentMode, COVER_CONTENT_MODES } from './coverMode';
import { PageData } from '../types';

// 构造一个最小可用的 page 对象（其余字段用默认值占位）
function makePage(overrides: Partial<PageData> = {}): PageData {
  return {
    id: 'test-page',
    type: 'cover',
    image: '',
    titleEn: '',
    titleZh: '',
    byline: '',
    footerLeft: '',
    footerRight: '',
    ...overrides,
  };
}

describe('resolveCoverContentMode', () => {
  it('页面显式设置 coverContentMode 为 quote 时，返回 quote', () => {
    const page = makePage({ coverContentMode: 'quote' });
    expect(resolveCoverContentMode(page)).toBe('quote');
  });

  it('页面显式设置 coverContentMode 为 split 时，返回 split', () => {
    const page = makePage({ coverContentMode: 'split' });
    expect(resolveCoverContentMode(page)).toBe('split');
  });

  it('未显式设置、仅有 quote、无正文时，返回 quote（旧数据不回退丢失）', () => {
    const page = makePage({ quoteEn: 'A quote', quoteZh: '引言' });
    expect(resolveCoverContentMode(page)).toBe('quote');
  });

  it('未显式设置、仅 leftContent 有正文、无 quote 时，返回 split', () => {
    const page = makePage({ leftContent: '<p>正文内容</p>' });
    expect(resolveCoverContentMode(page)).toBe('split');
  });

  it('未显式设置、仅有非空 paragraphs、无 quote 时，返回 split', () => {
    const page = makePage({ paragraphs: [{ id: 'p1' }] as PageData['paragraphs'] });
    expect(resolveCoverContentMode(page)).toBe('split');
  });

  it('未显式设置、同时有 quote 和 paragraphs 两部分时，返回 split', () => {
    const page = makePage({
      quoteEn: 'A quote',
      paragraphs: [{ id: 'p1' }] as PageData['paragraphs'],
    });
    expect(resolveCoverContentMode(page)).toBe('split');
  });

  it('未显式设置、全新空对象时，返回 split（新页面默认双栏）', () => {
    const page = makePage();
    expect(resolveCoverContentMode(page)).toBe('split');
  });

  it('leftContent 仅为空白字符串时视为无正文，配合有 quote 则应返回 quote', () => {
    const page = makePage({ quoteZh: '引言', leftContent: '   ' });
    expect(resolveCoverContentMode(page)).toBe('quote');
  });

  it('paragraphs 为空数组时视为无正文，配合有 quote 则应返回 quote', () => {
    const page = makePage({ quoteEn: 'A quote', paragraphs: [] });
    expect(resolveCoverContentMode(page)).toBe('quote');
  });

  it('显式属性传非法字符串 foo 时，回退到自动判定逻辑且不抛异常', () => {
    // coverContentMode 类型为联合类型，这里用类型断言模拟脏数据/旧数据
    const dirty = makePage({ quoteZh: '引言' }) as unknown as { coverContentMode: string };
    dirty.coverContentMode = 'foo';
    // 有 quote 无正文，应回落为 quote
    expect(resolveCoverContentMode(dirty as unknown as PageData)).toBe('quote');
  });

  it('显式属性传非法字符串 foo 且无正文时，回退为 split（不抛异常）', () => {
    const dirty = makePage() as unknown as { coverContentMode: string };
    dirty.coverContentMode = 'foo';
    expect(resolveCoverContentMode(dirty as unknown as PageData)).toBe('split');
  });
});

describe('COVER_CONTENT_MODES', () => {
  it('收录所有合法的正文模式 quote 与 split', () => {
    expect(COVER_CONTENT_MODES).toEqual(['quote', 'split']);
  });
});