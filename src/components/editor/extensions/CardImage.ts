import { Node, mergeAttributes } from '@tiptap/core';

export interface CardImageOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cardImage: {
      setCardImage: (options: { src: string; caption?: string; id?: string }) => ReturnType;
    };
  }
}

export const CardImage = Node.create<CardImageOptions>({
  name: 'cardImage',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'card-image-wrapper my-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100',
      },
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      caption: {
        default: '',
      },
      id: {
        default: null,
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure.card-image-wrapper',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ['img', { src: HTMLAttributes.src, 'data-card-id': HTMLAttributes.id, class: 'w-full rounded-lg cursor-zoom-in' }],
      ['figcaption', { class: 'text-xs text-slate-500 mt-2 text-center italic' }, HTMLAttributes.caption],
    ];
  },

  addCommands() {
    return {
      setCardImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});
