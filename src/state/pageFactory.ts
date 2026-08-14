import { PageData, PageType } from '../types';
import {
  DEFAULT_COVER_TEMPLATE_ID,
  DEFAULT_ARTICLE_TEMPLATE_ID,
  getTemplateById,
} from '../config/templates';

const nowId = () => `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const basePageDefaults = (): Omit<PageData, 'id' | 'type' | 'layoutId'> => ({
  image: 'https://picsum.photos/id/43/1200/1600',
  titleEn: 'Example English Title',
  titleZh: '示例中文标题',
  byline: 'By Author Name | PUBLICATION',
  footerLeft: 'Footer Left Label',
  footerRight: 'Footer Right Label',
  lineHeight: 1.6,
  paragraphSpacing: 32,
  backgroundColor: '#FAF9F4',
  accentColor: '#367237',
  splitRatio: 64,
  fontBalance: 0,
  footerSwap: false,
  footerRightType: 'text',
  footerLogoSize: 24,
  footerRightX: 0,
  footerRightY: 0,
  titleEnFont: "'Inter', sans-serif",
  titleZhFont: "'Crimson Pro', serif",
  paragraphEnFont: "'Inter', sans-serif",
  paragraphZhFont: "'Crimson Pro', serif",
  bylineFont: "'Inter', sans-serif",
  footerFont: "'Inter', sans-serif",
  footnoteFont: "'Inter', sans-serif",
  quoteEnFont: "'Inter', sans-serif",
  quoteZhFont: "'Crimson Pro', serif",
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
  paragraphs: [{ id: `p-${Date.now()}`, en: 'Start writing...', zh: '开始写作...' }],
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
  'splitRatio', 'fontBalance',
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

  if (sourcePage) {
    for (const field of inheritFields) {
      if (sourcePage[field] !== undefined) {
        // @ts-ignore
        page[field] = deepClone(sourcePage[field]);
      }
    }

    if (resolvedType === 'article' && resolvedLayoutId !== 'intensive-reading' && !page.paragraphs?.length) {
      page.paragraphs = [{ id: `p-${Date.now()}`, en: 'New paragraph text in English.', zh: '新的中文段落文字。' }];
    }
  }

  return page;
}

export function getTemplateSpec(templateId: string | null | undefined) {
  return getTemplateById(templateId) || null;
}
