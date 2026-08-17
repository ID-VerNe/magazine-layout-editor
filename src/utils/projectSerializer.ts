import { ProjectData, CustomFont, PageData, PageSize, PageType, Paragraph, ExternalAnnotation, ImageConfig } from '../types';
import { COVER_CONTENT_MODES } from './coverMode';

const VALID_PAGE_SIZES: PageSize[] = ['A4', '9:15', 'Unlimited'];
const VALID_PAGE_TYPES: PageType[] = ['cover', 'article'];

// 安全的对象键/主键校验：禁止 __proto__、constructor、prototype，避免原型污染
const SAFE_ID_RE = /^(?!__proto__$|constructor$|prototype$)[A-Za-z0-9_$:-]{1,64}$/;

function sanitizeId(value: any, fallback: () => string): string {
  if (typeof value === 'string') {
    const v = value.trim();
    if (v && SAFE_ID_RE.test(v)) return v;
  }
  return fallback();
}

// 图片/Logo 的 URL 协议白名单：仅允许受信协议（data 图片 / http(s) / blob），
// 防止 javascript: 等不可信协议流入渲染上下文（纵深防御）。
function sanitizeImageUrl(value: any): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (v && /^(data:image\/[a-z0-9+.-]+;base64,|https?:\/\/|blob:)/i.test(v)) return v;
  return undefined;
}

export function serializeProject(pages: PageData[], customFonts: CustomFont[], pageSize: PageSize): ProjectData {
  return {
    version: '1.0',
    pages,
    customFonts,
    settings: { pageSize },
  };
}

export function exportProjectFile(projectData: ProjectData, filenamePrefix = 'project'): void {
  const json = JSON.stringify(projectData);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.wdzmaga`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeParagraphs(input: any): Paragraph[] | undefined {
  if (!Array.isArray(input)) return undefined;
  return input
    .filter(p => p && typeof p === 'object')
    .map((p, idx) => ({
      id: sanitizeId(p.id, () => `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
      en: typeof p.en === 'string' ? p.en : '',
      zh: typeof p.zh === 'string' ? p.zh : '',
      enFont: typeof p.enFont === 'string' ? p.enFont : undefined,
      zhFont: typeof p.zhFont === 'string' ? p.zhFont : undefined,
      emphasis: typeof p.emphasis === 'boolean' ? p.emphasis : undefined,
    }));
}

function sanitizeAnnotations(input: any): ExternalAnnotation[] | undefined {
  if (!Array.isArray(input)) return undefined;
  return input
    .filter(a => a && typeof a === 'object')
    .map((a, idx) => ({
      id: sanitizeId(a.id, () => `ann-${Date.now()}-${idx}`),
      seq: typeof a.seq === 'number' ? a.seq : idx + 1,
      text: typeof a.text === 'string' ? a.text : '',
      from: typeof a.from === 'number' ? a.from : 0,
      to: typeof a.to === 'number' ? a.to : 0,
      comment: typeof a.comment === 'string' ? a.comment : undefined,
      fontSize: typeof a.fontSize === 'string' ? a.fontSize : undefined,
    }));
}

function sanitizeImageConfig(input: any): ImageConfig | undefined {
  if (!input || typeof input !== 'object') return undefined;
  return {
    scale: typeof input.scale === 'number' && !isNaN(input.scale) ? input.scale : 1,
    x: typeof input.x === 'number' && !isNaN(input.x) ? input.x : 0,
    y: typeof input.y === 'number' && !isNaN(input.y) ? input.y : 0,
    height: typeof input.height === 'number' && !isNaN(input.height) ? input.height : 300,
  };
}

function sanitizePage(page: any, index: number): PageData {
  if (!page || typeof page !== 'object') {
    return {
      id: `page-${Date.now()}-${index}`,
      type: 'cover',
      layoutId: 'classic-cover',
      image: '',
      titleEn: 'Untitled',
      titleZh: '无标题',
      byline: '',
      footerLeft: '',
      footerRight: '',
    };
  }

  const type: PageType = VALID_PAGE_TYPES.includes(page.type) ? page.type : 'cover';
  const id = sanitizeId(page.id, () => `page-${Date.now()}-${index}`);
  const layoutId = typeof page.layoutId === 'string' && page.layoutId.trim()
    ? page.layoutId
    : (type === 'cover' ? 'classic-cover' : 'classic-article');

  // Whitelist-based sanitization avoiding unrestricted spread
  const sanitized: PageData = {
    id,
    type,
    layoutId,
    lastCoverLayoutId: typeof page.lastCoverLayoutId === 'string' ? page.lastCoverLayoutId : undefined,
    lastArticleLayoutId: typeof page.lastArticleLayoutId === 'string' ? page.lastArticleLayoutId : undefined,
    image: sanitizeImageUrl(page.image) || '',
    logo: sanitizeImageUrl(page.logo),
    logoSize: typeof page.logoSize === 'number' ? page.logoSize : undefined,
    logoX: typeof page.logoX === 'number' ? page.logoX : undefined,
    logoY: typeof page.logoY === 'number' ? page.logoY : undefined,
    badgeColor: typeof page.badgeColor === 'string' ? page.badgeColor : undefined,
    badgeRadius: typeof page.badgeRadius === 'number' ? page.badgeRadius : undefined,
    hideDisclaimer: typeof page.hideDisclaimer === 'boolean' ? page.hideDisclaimer : undefined,
    backgroundColor: typeof page.backgroundColor === 'string' ? page.backgroundColor : undefined,
    accentColor: typeof page.accentColor === 'string' ? page.accentColor : undefined,
    showApprovedStamp: typeof page.showApprovedStamp === 'boolean' ? page.showApprovedStamp : undefined,
    imagePosition: ['middle', 'bottom', 'absolute-bottom'].includes(page.imagePosition) ? page.imagePosition : undefined,
    footerSwap: typeof page.footerSwap === 'boolean' ? page.footerSwap : undefined,
    footerRightType: ['text', 'logo'].includes(page.footerRightType) ? page.footerRightType : undefined,
    footerLogo: sanitizeImageUrl(page.footerLogo),
    footerLogoSize: typeof page.footerLogoSize === 'number' ? page.footerLogoSize : undefined,
    footerRightX: typeof page.footerRightX === 'number' ? page.footerRightX : undefined,
    footerRightY: typeof page.footerRightY === 'number' ? page.footerRightY : undefined,
    splitRatio: typeof page.splitRatio === 'number' ? page.splitRatio : undefined,
    fontBalance: typeof page.fontBalance === 'number' ? page.fontBalance : undefined,
    coverContentMode: COVER_CONTENT_MODES.includes(page.coverContentMode) ? page.coverContentMode : undefined,
    imageConfig: sanitizeImageConfig(page.imageConfig),
    titleEn: typeof page.titleEn === 'string' ? page.titleEn : '',
    titleZh: typeof page.titleZh === 'string' ? page.titleZh : '',
    byline: typeof page.byline === 'string' ? page.byline : '',
    footerLeft: typeof page.footerLeft === 'string' ? page.footerLeft : '',
    footerRight: typeof page.footerRight === 'string' ? page.footerRight : '',
    lineHeight: typeof page.lineHeight === 'number' ? page.lineHeight : undefined,
    paragraphSpacing: typeof page.paragraphSpacing === 'number' ? page.paragraphSpacing : undefined,
    titleEnFont: typeof page.titleEnFont === 'string' ? page.titleEnFont : undefined,
    titleZhFont: typeof page.titleZhFont === 'string' ? page.titleZhFont : undefined,
    bylineFont: typeof page.bylineFont === 'string' ? page.bylineFont : undefined,
    quoteEnFont: typeof page.quoteEnFont === 'string' ? page.quoteEnFont : undefined,
    quoteZhFont: typeof page.quoteZhFont === 'string' ? page.quoteZhFont : undefined,
    footerFont: typeof page.footerFont === 'string' ? page.footerFont : undefined,
    paragraphEnFont: typeof page.paragraphEnFont === 'string' ? page.paragraphEnFont : undefined,
    paragraphZhFont: typeof page.paragraphZhFont === 'string' ? page.paragraphZhFont : undefined,
    footnoteFont: typeof page.footnoteFont === 'string' ? page.footnoteFont : undefined,
    quoteEn: typeof page.quoteEn === 'string' ? page.quoteEn : undefined,
    quoteZh: typeof page.quoteZh === 'string' ? page.quoteZh : undefined,
    featuredText: typeof page.featuredText === 'string' ? page.featuredText : undefined,
    paragraphs: sanitizeParagraphs(page.paragraphs),
    footnote: typeof page.footnote === 'string' ? page.footnote : undefined,
    leftContent: typeof page.leftContent === 'string' ? page.leftContent : undefined,
    annotations: sanitizeAnnotations(page.annotations),
    annotationStyle: ['dual', 'single'].includes(page.annotationStyle) ? page.annotationStyle : undefined,
    annotationTheme: ['highlight', 'underline', 'both'].includes(page.annotationTheme) ? page.annotationTheme : undefined,
    hideAnnotationSeq: typeof page.hideAnnotationSeq === 'boolean' ? page.hideAnnotationSeq : undefined,
  };

  return sanitized;
}

function sanitizeFonts(fonts: any): CustomFont[] {
  if (!Array.isArray(fonts)) return [];
  return fonts
    .filter(f => f && typeof f === 'object' && typeof f.name === 'string' && typeof f.family === 'string')
    .map(f => {
      const cleanName = String(f.name).slice(0, 100);
      const cleanFamily = String(f.family).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().slice(0, 100);
      const rawDataUrl = typeof f.dataUrl === 'string' ? f.dataUrl.trim() : '';
      // 只剥离引号/花括号/换行；保留 data URL 中合法的 `;`（如 ;base64,）
      const cleaned = rawDataUrl.replace(/["'\n\r{}]/g, '');
      const dataUrl = cleaned.startsWith('data:') ? cleaned : undefined;
      return {
        name: cleanName,
        family: cleanFamily || `custom-font-${Date.now()}`,
        dataUrl,
      };
    });
}

// 对反序列化的项目对象执行统一清洗（导入文件与 IndexedDB 读取共用同一入口，
// 避免 DB 路径绕过白名单导致脏/旧结构残留）
export function sanitizeProjectData(raw: any): ProjectData {
  const pages: PageData[] = Array.isArray(raw?.pages)
    ? raw.pages.map((p: any, idx: number) => sanitizePage(p, idx))
    : [];
  const customFonts: CustomFont[] = Array.isArray(raw?.customFonts) ? sanitizeFonts(raw?.customFonts) : [];

  let pageSize: PageSize = 'A4';
  if (raw?.settings && typeof raw.settings === 'object' && VALID_PAGE_SIZES.includes(raw.settings.pageSize)) {
    pageSize = raw.settings.pageSize;
  }

  return {
    version: typeof raw?.version === 'string' ? raw.version : '1.0',
    pages,
    customFonts,
    settings: { pageSize },
  };
}

export function parseProjectFile(file: File): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result;
        if (typeof raw !== 'string' || !raw.trim()) {
          throw new Error('Project file is empty or unreadable.');
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid project format: root must be an object.');
        }

        if (!Array.isArray(parsed.pages) || parsed.pages.length === 0) {
          throw new Error('Invalid project format: pages array is missing or empty.');
        }

        resolve(sanitizeProjectData(parsed));
      } catch (err: any) {
        reject(new Error(err.message || 'Failed to parse project file.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('File read error'));
    reader.readAsText(file);
  });
}
