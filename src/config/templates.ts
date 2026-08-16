import { PageType } from '../types';

export type TemplateCategory = 'Cover' | 'Article';

export type EditorSectionId =
  | 'layout'
  | 'image'
  | 'headlines'
  | 'cover-features'
  | 'content'
  | 'intensive-content'
  | 'colors'
  | 'footer'
  | 'blueprint-stamp'
  | 'advanced';

export interface TemplateDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  type: PageType;
  description: string;
  previewImage: string;
  sections: EditorSectionId[];
}

export const TEMPLATES: TemplateDefinition[] = [
  // ─── Cover Templates ────────────────────────────
  {
    id: 'classic-cover',
    name: 'Classic Editorial',
    category: 'Cover',
    type: 'cover',
    description: 'Traditional layout with hero imagery and bold serif headlines.',
    previewImage: '/previews/classic.png',
    sections: ['layout', 'image', 'headlines', 'intensive-content', 'content', 'colors', 'footer'],
  },
  {
    id: 'impact-bold',
    name: 'Impact Bold',
    category: 'Cover',
    type: 'cover',
    description: 'Full-bleed imagery with high-contrast typography.',
    previewImage: '/previews/impact.png',
    sections: ['layout', 'image', 'headlines', 'cover-features', 'colors', 'footer'],
  },
  {
    id: 'cinematic',
    name: 'Cinematic 16:9',
    category: 'Cover',
    type: 'cover',
    description: 'Letterboxed 16:9 frame for epic scenic photography.',
    previewImage: '/previews/cinematic.png',
    sections: ['layout', 'image', 'headlines', 'colors', 'footer'],
  },
  {
    id: 'blueprint',
    name: 'Engineering Blueprint',
    category: 'Cover',
    type: 'cover',
    description: 'Engineering style with grids, technical labels and monospace.',
    previewImage: '/previews/blueprints.png',
    sections: ['layout', 'image', 'headlines', 'blueprint-stamp', 'cover-features', 'colors', 'footer'],
  },
  {
    id: 'tabloid',
    name: 'Tabloid News',
    category: 'Cover',
    type: 'cover',
    description: 'Aggressive, skewed typography with bold highlight blocks.',
    previewImage: '/previews/tabloid.png',
    sections: ['layout', 'image', 'headlines', 'colors', 'footer'],
  },
  {
    id: 'typography',
    name: 'Typographic Poster',
    category: 'Cover',
    type: 'cover',
    description: 'Clean Swiss-style layout focusing on massive text graphics.',
    previewImage: '/previews/typography.png',
    sections: ['layout', 'headlines', 'cover-features', 'colors', 'footer'],
  },

  // ─── Article Templates ──────────────────────────
  {
    id: 'classic-article',
    name: 'Modern Split',
    category: 'Article',
    type: 'article',
    description: 'Optimized dual-column bilingual reading experience.',
    previewImage: '/previews/modern.png',
    sections: ['layout', 'image', 'headlines', 'content', 'advanced', 'colors', 'footer'],
  },
  {
    id: 'modern-vertical',
    name: 'Modern Vertical',
    category: 'Article',
    type: 'article',
    description: 'Vertical flow reading experience.',
    previewImage: '/previews/modern.png',
    sections: ['layout', 'image', 'headlines', 'content', 'advanced', 'colors', 'footer'],
  },
  {
    id: 'blueprint-article',
    name: 'Engineering Article',
    category: 'Article',
    type: 'article',
    description: 'Technical dual-column layout with engineering grids and monospace.',
    previewImage: '/previews/blueprints_article.png',
    sections: ['layout', 'image', 'headlines', 'content', 'blueprint-stamp', 'advanced', 'colors', 'footer'],
  },
  {
    id: 'intensive-reading',
    name: 'Intensive Reading',
    category: 'Article',
    type: 'article',
    description: 'Dual-column with interactive vocabulary and sentence annotations.',
    previewImage: '/previews/modern.png',
    sections: ['layout', 'image', 'headlines', 'intensive-content', 'advanced', 'colors', 'footer'],
  },
];

export const TEMPLATE_MAP = new Map<string, TemplateDefinition>(
  TEMPLATES.map(tpl => [tpl.id, tpl])
);

export const DEFAULT_COVER_TEMPLATE_ID = 'classic-cover';
export const DEFAULT_ARTICLE_TEMPLATE_ID = 'classic-article';

export function getTemplateById(id?: string | null): TemplateDefinition | undefined {
  if (!id) return undefined;
  return TEMPLATE_MAP.get(id.toLowerCase());
}

export function getTemplateSections(layoutId?: string, pageType?: PageType): EditorSectionId[] {
  const tpl = getTemplateById(layoutId);
  if (tpl) return tpl.sections;
  return pageType === 'article'
    ? TEMPLATE_MAP.get(DEFAULT_ARTICLE_TEMPLATE_ID)!.sections
    : TEMPLATE_MAP.get(DEFAULT_COVER_TEMPLATE_ID)!.sections;
}
