import { Mark, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import type { Mark as PMMark } from '@tiptap/pm/model';
import { BOUNDARY_CHARS } from '../intensive/annotationHelpers';

export interface AnnotationMarkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotationMark: {
      setAnnotation: (id: string, seq: number) => ReturnType;
      unsetAnnotation: (id: string) => ReturnType;
    };
  }
}

export const AnnotationMark = Mark.create<AnnotationMarkOptions>({
  name: 'annotationMark',
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'annotation-mark',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark[data-annotation-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-annotation-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-annotation-id': attributes.id };
        },
      },
      seq: {
        default: null,
        parseHTML: element => element.getAttribute('data-seq'),
        renderHTML: attributes => {
          if (!attributes.seq) return {};
          return { 'data-seq': attributes.seq };
        },
      },
    };
  },

  addCommands() {
    return {
      setAnnotation: (id: string, seq: number) => ({ commands, tr, state }) => {
        const { from, to } = state.selection;
        let finalFrom = from;
        let finalTo = to;
        
        // If empty selection, expand to word using BOUNDARY_CHARS for consistent CJK & Latin boundary support
        if (from === to) {
          const $pos = state.doc.resolve(from);
          const text = $pos.parent.textContent;
          const parentOffset = $pos.parentOffset;

          let start = parentOffset;
          while (start > 0 && !BOUNDARY_CHARS.has(text[start - 1])) start--;

          let end = parentOffset;
          while (end < text.length && !BOUNDARY_CHARS.has(text[end])) end++;

          finalFrom = $pos.pos - parentOffset + start;
          finalTo = $pos.pos - parentOffset + end;
          
          if (finalFrom === finalTo) return false;
          
          tr.setSelection(TextSelection.create(state.doc, finalFrom, finalTo));
        }

        return commands.setMark(this.name, { id, seq });
      },
      unsetAnnotation: (id: string) => ({ tr, state, dispatch }) => {
        // 只移除目标 id 的 mark。此前按范围整体 removeMark，相邻/重叠的另一条批注会被一起删掉。
        const markType = state.schema.marks[this.name];
        const targets: Array<{ from: number; to: number; mark: PMMark }> = [];
        state.doc.descendants((node, pos) => {
          const mark = node.marks.find(m => m.type === markType && m.attrs.id === id);
          if (mark) targets.push({ from: pos, to: pos + node.nodeSize, mark });
        });

        if (targets.length === 0 || !dispatch) return false;
        targets.forEach(({ from, to, mark }) => tr.removeMark(from, to, mark));
        dispatch(tr);
        return true;
      },
    };
  },
});
