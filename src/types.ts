
export type PageType = 'cover' | 'article';

export interface Paragraph {
  id: string;
  en: string;
  zh: string;
  enFont?: string;
  zhFont?: string;
  emphasis?: boolean;
}

export interface ImageConfig {
  scale: number;
  x: number;
  y: number;
  height: number;
}

export interface PageData {
  id: string;
  type: PageType;
  layoutId?: string;
  lastCoverLayoutId?: string;
  lastArticleLayoutId?: string;
  image: string;
  logo?: string; 
  logoSize?: number;
  logoX?: number;
  logoY?: number;
  badgeColor?: string;
  badgeRadius?: number;
  hideDisclaimer?: boolean;
  backgroundColor?: string;
  accentColor?: string;
  showApprovedStamp?: boolean;
  imagePosition?: 'middle' | 'bottom' | 'absolute-bottom';
  footerSwap?: boolean;
  footerRightType?: 'text' | 'logo';
  footerLogo?: string;
  footerLogoSize?: number;
  footerRightX?: number;
  footerRightY?: number;
  splitRatio?: number; // 英文占比，默认 60
  fontBalance?: number; // 调整语种间的相对大小，默认 0
  imageConfig?: ImageConfig;
  titleEn: string;
  titleZh: string;
  byline: string;
  footerLeft: string;
  footerRight: string;
  lineHeight?: number; // Line spacing for paragraphs
  paragraphSpacing?: number; // Spacing between paragraphs
  
  // Font settings
  titleEnFont?: string;
  titleZhFont?: string;
  bylineFont?: string;
  quoteEnFont?: string;
  quoteZhFont?: string;
  footerFont?: string;
  paragraphEnFont?: string;
  paragraphZhFont?: string;
  footnoteFont?: string;

  // Cover specific
  quoteEn?: string;
  quoteZh?: string;
  featuredText?: string;
  // Article specific
  paragraphs?: Paragraph[];
  footnote?: string;
}

export interface CustomFont {
  name: string;
  family: string;
  dataUrl?: string; // Store actual font data for export/import
}

export type PageSize = 'A4' | '9:15' | 'Unlimited';

export interface ProjectData {
  version: string;
  pages: PageData[];
  customFonts: CustomFont[];
  settings: {
    pageSize: PageSize;
  }
}

export interface AppState {
  pages: PageData[];
  currentPageId: string;
}
