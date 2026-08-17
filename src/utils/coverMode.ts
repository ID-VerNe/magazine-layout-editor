import { PageData } from '../types';

export type CoverContentMode = 'quote' | 'split';

// 收录所有合法正文模式，供数据清洗时做白名单校验
export const COVER_CONTENT_MODES: CoverContentMode[] = ['quote', 'split'];

// 判定 classic-cover 的正文内容模式。
// 优先采纳页面显式设置；否则做向后兼容：老数据只有引言（quote）、没有段落/正文时，
// 默认回落到「引言」模式，避免版本升级后旧封面正文静默消失。其余情况（含新页面）默认「双栏」。
export function resolveCoverContentMode(page: PageData): CoverContentMode {
  if (page.coverContentMode === 'quote' || page.coverContentMode === 'split') {
    return page.coverContentMode;
  }
  const hasQuote = !!page.quoteEn || !!page.quoteZh;
  const hasSplitBody =
    !!(page.leftContent && page.leftContent.trim()) ||
    !!(page.paragraphs && page.paragraphs.length > 0);
  if (hasQuote && !hasSplitBody) return 'quote';
  return 'split';
}