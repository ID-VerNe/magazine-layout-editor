import { Mark, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

export interface AnnotationMarkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotationMark: {
      setAnnotation: (id: string, seq: number) => ReturnType;
      unsetAnnotation: (id: string) => ReturnType;
      setAnnotationFontSize: (id: string, fontSize: string) => ReturnType;
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
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
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
        
        // If empty selection, expand to word
        if (from === to) {
          const $pos = state.doc.resolve(from);
          const textBefore = $pos.parent.textBetween(0, $pos.parentOffset, undefined, '\ufffc');
          const textAfter = $pos.parent.textBetween($pos.parentOffset, $pos.parent.nodeSize - 2, undefined, '\ufffc');
          const matchBefore = textBefore.match(/[^\s.,!?'"()]+$/);
          const matchAfter = textAfter.match(/^[^\s.,!?'"()]+/);
          if (matchBefore) finalFrom -= matchBefore[0].length;
          if (matchAfter) finalTo += matchAfter[0].length;
          
          if (finalFrom === finalTo) return false;
          
          tr.setSelection(TextSelection.create(state.doc, finalFrom, finalTo));
        }

        return commands.setMark(this.name, { id, seq });
      },
      unsetAnnotation: (id: string) => ({ tr, state, dispatch }) => {
        let startPos = -1;
        let endPos = -1;
        state.doc.descendants((node, pos) => {
          const mark = node.marks.find(m => m.type.name === this.name && m.attrs.id === id);
          if (mark) {
            if (startPos === -1) startPos = pos;
            endPos = pos + node.nodeSize;
          }
        });

        if (startPos !== -1 && endPos !== -1 && dispatch) {
          tr.removeMark(startPos, endPos, state.schema.marks[this.name]);
          dispatch(tr);
          return true;
        }
        return false;
      },
      setAnnotationFontSize: (id: string, fontSize: string) => ({ tr, state, dispatch }) => {
        const markType = state.schema.marks[this.name];
        let changed = false;
        state.doc.descendants((node, pos) => {
          const mark = node.marks.find(m => m.type.name === this.name && m.attrs.id === id);
          if (mark) {
            const newMark = markType.create({ ...mark.attrs, fontSize });
            tr.addMark(pos, pos + node.nodeSize, newMark);
            changed = true;
          }
        });
        if (changed && dispatch) {
          dispatch(tr);
          return true;
        }
        return false;
      },
    };
  },
});
