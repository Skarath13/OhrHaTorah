// Bridge for the inline admin script (InlineEditor.astro, `is:inline`), which
// cannot import modules. Tiptap is code-split and fetched on first use.
export const installRichEditor = (): void => {
  (window as unknown as { ohtRichEditor: unknown }).ohtRichEditor = {
    async mount(element: HTMLElement, mode: 'inline' | 'block', point: { x: number; y: number } | null = null) {
      const { mountRichEditor } = await import('./richEditorTiptap.ts');
      return mountRichEditor(element, mode, point);
    },
  };
};
