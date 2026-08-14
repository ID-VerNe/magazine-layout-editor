import { Editor } from '@tiptap/react';
import { ExternalAnnotation } from '../../../types';

/**
 * Fast word boundary detection using Set (O(1) lookup vs O(n) regex)
 */
export const BOUNDARY_CHARS = new Set([
  ' ', '\t', '\n', ',', '.', '-', '!', '?', ';', ':', '"', "'",
  '(', ')', '[', ']', '{', '}', '<', '>',
  '，', '。', '！', '？', '；', '：', '“', '”', '‘', '’', '（', '）', '【', '】', '《', '》',
  '…', '—', '～', '·',
]);

/**
 * Extract annotations from ProseMirror document, preserving existing comments.
 * Re-sequences by position (1..N) in-place.
 */
export function extractAnnotationsFromDoc(
  doc: any,
  existingAnnotations: ExternalAnnotation[] = []
): ExternalAnnotation[] {
  const map = new Map<string, ExternalAnnotation>();
  const extracted: ExternalAnnotation[] = [];

  doc.descendants((node: any, pos: number) => {
    const mark = node.marks.find((m: any) => m.type.name === 'annotationMark');
    if (mark) {
      const id = mark.attrs.id;
      if (map.has(id)) {
        map.get(id)!.text += node.text || '';
        map.get(id)!.to = pos + node.nodeSize;
      } else {
        const oldAnn = existingAnnotations.find(a => a.id === id);
        extracted.push({
          id,
          seq: parseInt(mark.attrs.seq, 10),
          text: node.text || '',
          from: pos,
          to: pos + node.nodeSize,
          comment: oldAnn?.comment,
          fontSize: oldAnn?.fontSize,
        });
        map.set(id, extracted[extracted.length - 1]);
      }
    }
  });

  extracted.sort((a, b) => a.from - b.from);
  extracted.forEach((ann, i) => {
    ann.seq = i + 1;
  });

  return extracted;
}

/**
 * Lightweight snapshot for change detection.
 */
export function annotationHash(annotations: ExternalAnnotation[]): string {
  if (!annotations || annotations.length === 0) return '';
  return annotations.map(a => `${a.id}:${a.seq}:${a.text}`).join('|');
}

/**
 * Fix mark seq numbers in the editor by walking the CURRENT doc (positions are always
 * valid — never use stale from/to captured earlier). Guarded by transaction meta so
 * onUpdate doesn't re-enter.
 */
export function syncMarkSeq(editor: Editor, annotations: ExternalAnnotation[]) {
  const seqMap = new Map(annotations.map(a => [a.id, a.seq]));
  const tr = editor.state.tr;
  let changed = false;

  editor.state.doc.descendants((node, pos) => {
    const mark = node.marks.find(m => m.type.name === 'annotationMark');
    if (mark && seqMap.has(mark.attrs.id)) {
      const newSeq = seqMap.get(mark.attrs.id);
      if (String(mark.attrs.seq) !== String(newSeq)) {
        const newMark = editor.schema.marks.annotationMark.create({ ...mark.attrs, seq: newSeq });
        tr.addMark(pos, pos + node.nodeSize, newMark);
        changed = true;
      }
    }
  });

  if (changed) {
    tr.setMeta('annotationUpdate', true);
    editor.view.dispatch(tr);
  }
}

/**
 * Generate CSS styles for annotations based on theme
 */
export function getAnnotationThemeCSS(theme: string = 'highlight') {
  switch (theme) {
    case 'underline':
      return `
        text-decoration: underline; 
        text-decoration-color: #3b82f6; 
        text-decoration-thickness: 2px; 
        text-underline-offset: 4px; 
        background-color: transparent;
      `;
    case 'both':
      return `
        text-decoration: underline; 
        text-decoration-color: #3b82f6; 
        text-decoration-thickness: 2px; 
        text-underline-offset: 4px; 
        background-color: #eff6ff;
      `;
    case 'highlight':
    default:
      return `
        text-decoration: none;
        background-color: #eff6ff;
      `;
  }
}
