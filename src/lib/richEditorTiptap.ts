// Tiptap editing session for one `[data-editable]` element. Loaded on demand
// the first time an admin starts editing, so visitors never download it.
// Output is ProseMirror JSON; the element is re-rendered with the same
// allowlist renderer the server uses, so what admins see is what visitors get.
import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { renderRichDocument, renderRichInline, safeHref, type RichNode } from './richText.ts';

export type RichMode = 'inline' | 'block';

export type RichSession = {
  readonly baseline: string;
  finish(): string;
  cancel(): void;
};

// Inline text (headings, labels, single paragraphs): Enter inserts a line break
// instead of a new paragraph.
const InlineEnter = Extension.create({
  name: 'ohtInlineEnter',
  addKeyboardShortcuts() {
    return { Enter: () => this.editor.commands.setHardBreak() };
  },
});

const extensionsFor = (mode: RichMode) => {
  const block = mode === 'block';
  return [
    StarterKit.configure({
      code: false,
      codeBlock: false,
      strike: false,
      heading: block ? { levels: [2, 3] } : false,
      bulletList: block ? {} : false,
      orderedList: block ? {} : false,
      listItem: block ? {} : false,
      listKeymap: block ? {} : false,
      blockquote: block ? {} : false,
      horizontalRule: block ? {} : false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        isAllowedUri: (url) => safeHref(url) !== null,
      },
    }),
    ...(block ? [] : [InlineEnter]),
  ];
};

type ButtonSpec = {
  label: string;
  title: string;
  run: (editor: Editor) => void;
  active?: (editor: Editor) => boolean;
  blockOnly?: boolean;
};

const editLink = (editor: Editor) => {
  const current = String(editor.getAttributes('link').href ?? '');
  const answer = window.prompt('Web address for this link. Leave empty to remove the link.', current);
  if (answer === null) return;
  const href = answer.trim();
  if (!href) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  const safe = safeHref(href) ?? safeHref(`https://${href}`);
  if (!safe) {
    window.alert('That web address cannot be used. Try one starting with https://');
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: safe }).run();
};

const buttons: ButtonSpec[] = [
  { label: 'Bold', title: 'Bold (Ctrl+B)', run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive('bold') },
  { label: 'Italic', title: 'Italic (Ctrl+I)', run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive('italic') },
  { label: 'Link', title: 'Add or change a link', run: editLink, active: (e) => e.isActive('link') },
  { label: 'Heading', title: 'Section heading', blockOnly: true, run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive('heading', { level: 2 }) },
  { label: 'Subheading', title: 'Smaller heading', blockOnly: true, run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), active: (e) => e.isActive('heading', { level: 3 }) },
  { label: 'Bullets', title: 'Bulleted list', blockOnly: true, run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive('bulletList') },
  { label: 'Numbers', title: 'Numbered list', blockOnly: true, run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive('orderedList') },
  { label: 'Undo', title: 'Undo (Ctrl+Z)', run: (e) => e.chain().focus().undo().run() },
  { label: 'Redo', title: 'Redo (Ctrl+Shift+Z)', run: (e) => e.chain().focus().redo().run() },
];

const showFormatBar = (editor: Editor, mode: RichMode): (() => void) => {
  const bar = document.createElement('div');
  bar.className = 'oht-format-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Text formatting');

  const rendered = buttons
    .filter((spec) => mode === 'block' || !spec.blockOnly)
    .map((spec) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = spec.label;
      button.title = spec.title;
      // Keep the text selection while clicking a toolbar button.
      button.addEventListener('mousedown', (event) => event.preventDefault());
      button.addEventListener('click', () => spec.run(editor));
      bar.append(button);
      return { button, spec };
    });

  const done = document.createElement('span');
  done.className = 'oht-format-hint';
  done.textContent = 'Click outside the text when finished';
  bar.append(done);

  const refresh = () => {
    for (const { button, spec } of rendered) {
      if (spec.active) button.setAttribute('aria-pressed', String(spec.active(editor)));
    }
  };
  editor.on('transaction', refresh);
  refresh();
  document.body.append(bar);
  return () => {
    editor.off('transaction', refresh);
    bar.remove();
  };
};

export type ClickPoint = { x: number; y: number } | null;

export const mountRichEditor = (element: HTMLElement, mode: RichMode, point: ClickPoint = null): RichSession => {
  const startHTML = element.innerHTML;
  // Screen-reader hints are re-added by the renderer; editing them would make them visible.
  const editable = document.createElement('template');
  editable.innerHTML = startHTML;
  editable.content.querySelectorAll('.visually-hidden').forEach((node) => node.remove());
  element.innerHTML = '';
  const editor = new Editor({
    element,
    extensions: extensionsFor(mode),
    content: editable.innerHTML,
    editorProps: {
      attributes: {
        class: `oht-rich-editor oht-rich-${mode}`,
        'aria-label': 'Edit text',
        'aria-multiline': String(mode === 'block'),
      },
    },
  });
  // Put the cursor where the admin clicked. Never pre-select the text: one
  // keystroke would replace it all.
  const position = point ? editor.view.posAtCoords({ left: point.x, top: point.y }) : null;
  if (position) editor.chain().focus().setTextSelection(position.pos).run();
  else editor.commands.focus('end');

  const baseline = JSON.stringify(editor.getJSON());
  const hideBar = showFormatBar(editor, mode);

  return {
    baseline,
    finish() {
      const doc = editor.getJSON() as RichNode;
      hideBar();
      editor.destroy();
      element.innerHTML = mode === 'block' ? renderRichDocument(doc) : renderRichInline(doc);
      return JSON.stringify(doc);
    },
    cancel() {
      hideBar();
      editor.destroy();
      element.innerHTML = startHTML;
    },
  };
};
