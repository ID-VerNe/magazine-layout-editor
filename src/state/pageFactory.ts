import { PageData, PageType } from '../types';
import {
  DEFAULT_COVER_TEMPLATE_ID,
  DEFAULT_ARTICLE_TEMPLATE_ID,
  getTemplateById,
} from '../config/templates';
import { DEFAULT_ACCENT, DEFAULT_PAPER, DEFAULT_FONTS, DEFAULT_LINE_HEIGHT, DEFAULT_PARAGRAPH_SPACING } from '../utils/themeConstants';
import { clampSplitRatio, clampFontBalance } from '../utils/layoutMath';

const nowId = () => `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// 段落 id：带时间戳 + 随机分量，避免同毫秒内连续新增/新建页产生重复 key
export const nextParagraphId = () => `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const basePageDefaults = (): Omit<PageData, 'id' | 'type' | 'layoutId'> => ({
  image: 'https://picsum.photos/id/43/1200/1600',
  titleEn: 'Example English Title',
  titleZh: '示例中文标题',
  byline: 'By Author Name | PUBLICATION',
  footerLeft: 'Footer Left Label',
  footerRight: 'Footer Right Label',
  lineHeight: DEFAULT_LINE_HEIGHT,
  paragraphSpacing: DEFAULT_PARAGRAPH_SPACING,
  backgroundColor: DEFAULT_PAPER,
  accentColor: DEFAULT_ACCENT,
  splitRatio: 64,
  fontBalance: 0,
  footerSwap: false,
  footerRightType: 'text',
  footerLogoSize: 24,
  footerRightX: 0,
  footerRightY: 0,
  titleEnFont: DEFAULT_FONTS.en,
  titleZhFont: DEFAULT_FONTS.zh,
  paragraphEnFont: DEFAULT_FONTS.en,
  paragraphZhFont: DEFAULT_FONTS.zh,
  bylineFont: DEFAULT_FONTS.en,
  footerFont: DEFAULT_FONTS.en,
  footnoteFont: DEFAULT_FONTS.en,
  quoteEnFont: DEFAULT_FONTS.en,
  quoteZhFont: DEFAULT_FONTS.zh,
});

const coverDefaults = (): Partial<PageData> => ({
  type: 'cover',
  layoutId: DEFAULT_COVER_TEMPLATE_ID,
  quoteEn: 'This is an example quote text in English.',
  quoteZh: '这是一段示例引言中文文字。',
  featuredText: '@ExampleBadge',
});

const articleDefaults = (): Partial<PageData> => ({
  type: 'article',
  layoutId: DEFAULT_ARTICLE_TEMPLATE_ID,
  paragraphs: [{ id: nextParagraphId(), en: 'Start writing...', zh: '开始写作...' }],
});

export interface CreatePageOptions {
  templateId?: string | null;
  type?: PageType;
  sourcePage?: PageData;
  inheritFields?: Array<keyof PageData>;
}

export const DEFAULT_INHERIT_FIELDS: Array<keyof PageData> = [
  'titleEn', 'titleZh', 'byline',
  'footerLeft', 'footerRight',
  'lineHeight', 'paragraphSpacing',
  'backgroundColor', 'accentColor',
  'splitRatio', 'fontBalance', 'coverContentMode',
  'titleEnFont', 'titleZhFont', 'bylineFont',
  'quoteEnFont', 'quoteZhFont',
  'footerFont', 'paragraphEnFont', 'paragraphZhFont', 'footnoteFont',
  'footerSwap', 'footerRightType', 'footerLogo', 'footerLogoSize', 'footerRightX', 'footerRightY',
  'imagePosition', 'imageConfig',
  'badgeColor', 'badgeRadius',
  'annotationStyle', 'annotationTheme', 'hideAnnotationSeq',
  'hideDisclaimer',
];

function deepClone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // Fallback below
    }
  }
  return JSON.parse(JSON.stringify(value));
}

export function createPageFromTemplate(options: CreatePageOptions = {}): PageData {
  const { templateId, type, sourcePage, inheritFields = DEFAULT_INHERIT_FIELDS } = options;
  const templateSpec = getTemplateById(templateId);

  const resolvedType: PageType = templateSpec?.type || type || sourcePage?.type || 'cover';
  const resolvedLayoutId =
    templateSpec?.id || (resolvedType === 'cover' ? DEFAULT_COVER_TEMPLATE_ID : DEFAULT_ARTICLE_TEMPLATE_ID);

  const page: PageData = {
    id: nowId(),
    ...(basePageDefaults()),
    ...(resolvedType === 'cover' ? coverDefaults() : articleDefaults()),
    type: resolvedType,
    layoutId: resolvedLayoutId,
  } as PageData;

  if (resolvedLayoutId === 'intensive-reading') {
    page.leftContent = '<p>Start typing the main article text here...</p>';
    page.annotations = [];
    page.annotationStyle = page.annotationStyle || 'dual';
    page.annotationTheme = page.annotationTheme || 'highlight';
    page.hideAnnotationSeq = page.hideAnnotationSeq || false;
    page.paragraphs = undefined;
  }

  if (resolvedLayoutId === 'classic-cover') {
    page.coverContentMode = 'split';
    // 双栏正文默认走段落模式：不初始化 leftContent，避免与新页面的段落双栏重复叠加渲染
    page.leftContent = undefined;
    page.annotations = undefined;
    page.annotationStyle = page.annotationStyle || 'dual';
    page.annotationTheme = page.annotationTheme || 'highlight';
    page.hideAnnotationSeq = page.hideAnnotationSeq || false;
    page.paragraphs = page.paragraphs || [{ id: nextParagraphId(), en: 'Start writing...', zh: '开始写作...' }];
    page.quoteEn = undefined;
    page.quoteZh = undefined;
  }

  if (sourcePage) {
    for (const field of inheritFields) {
      if (sourcePage[field] !== undefined) {
        // @ts-ignore
        page[field] = deepClone(sourcePage[field]);
      }
    }

    if (resolvedType === 'article' && resolvedLayoutId !== 'intensive-reading' && !page.paragraphs?.length) {
      page.paragraphs = [{ id: nextParagraphId(), en: 'New paragraph text in English.', zh: '新的中文段落文字。' }];
    }
  }

  // 输出前统一钳制双栏比例与字号平衡：DOM 层 / 继承的 sourcePage 可能带入越界值，
  // 会在未经过 UI 滑块（即无范围约束）的路径（读档、序列化恢复、模板继承）下破坏整页布局，
  // 这里与 layoutMath 的防御性兜底保持一致，回退到安全范围。
  page.splitRatio = clampSplitRatio(page.splitRatio);
  page.fontBalance = clampFontBalance(page.fontBalance);

  return page;
}

export function getTemplateSpec(templateId: string | null | undefined) {
  return getTemplateById(templateId) || null;
}
