import { Node, mergeAttributes } from '@tiptap/core';

export interface AnnotationBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotationBlock: {
      setAnnotationBlock: (options: { id: string, seq: number, refText: string }) => ReturnType;
    };
  }
}

export const AnnotationBlock = Node.create<AnnotationBlockOptions>({
  name: 'annotationBlock',
  group: 'block',
  content: 'block+',
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'annotation-block p-3 border border-slate-200 rounded-lg bg-slate-50 mb-4',
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-id': attributes.id };
        },
      },
      seq: {
        default: 1,
        parseHTML: element => parseInt(element.getAttribute('data-seq') || '1', 10),
        renderHTML: attributes => {
          return { 'data-seq': attributes.seq };
        },
      },
      refText: {
        default: '',
        parseHTML: element => element.getAttribute('data-ref-text'),
        renderHTML: attributes => {
          return { 'data-ref-text': attributes.refText };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.annotation-block',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ['div', { 
        class: 'annotation-label font-bold text-sm text-[#367237] mb-2 select-none pointer-events-none', 
        contenteditable: 'false' 
      }, `[${node.attrs.seq}] ${node.attrs.refText}`],
      ['div', { class: 'annotation-content bg-white p-2 rounded border border-slate-100' }, 0],
    ];
  },

  addCommands() {
    return {
      setAnnotationBlock: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
          content: [
            { type: 'paragraph' }
          ]
        });
      },
    };
  },
});
