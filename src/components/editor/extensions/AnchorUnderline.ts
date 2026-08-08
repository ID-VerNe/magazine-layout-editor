import { Mark, mergeAttributes } from '@tiptap/core';

export interface AnchorUnderlineOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    anchorUnderline: {
      /**
       * Set an anchor underline
       */
      setAnchorUnderline: (id: string) => ReturnType;
      /**
       * Unset an anchor underline
       */
      unsetAnchorUnderline: () => ReturnType;
    };
  }
}

export const AnchorUnderline = Mark.create<AnchorUnderlineOptions>({
  name: 'anchorUnderline',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'anchor-underline relative cursor-pointer',
        style: 'text-decoration: underline; text-decoration-color: currentColor; text-decoration-thickness: 2px;',
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-anchor-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-anchor-id': attributes.id,
            'data-anchor-id-short': attributes.id.slice(-4),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'u[data-anchor-id]',
      },
      {
        tag: 'span.anchor-underline',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['u', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setAnchorUnderline: (id: string) => ({ commands }) => {
        return commands.setMark(this.name, { id });
      },
      unsetAnchorUnderline: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
