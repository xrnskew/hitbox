import { EditorView } from '@codemirror/view'

// Цвета — из CSS-переменных (src/styles/tokens.css), поэтому тема проектора
// переключается без перенастройки редактора.
// { dark: true } обязателен: без него базовая тема CodeMirror светлая, и её стили
// активной строки и выделения перебивают наши.
export const editorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      color: 'var(--scr-ink)',
      backgroundColor: 'var(--scr)',
      fontSize: 'var(--code-size)',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
      lineHeight: '1.6',
      fontVariantLigatures: 'none',
      fontFeatureSettings: '"liga" 0, "calt" 0',
    },
    // снизу запас под уведомление: последнюю строку можно прокрутить выше него
    '.cm-content': { caretColor: 'var(--sun)', padding: '12px 0 88px' },
    '.cm-line': { padding: '0 16px 0 8px' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--sun)', borderLeftWidth: '2px' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      { backgroundColor: 'var(--scr-selection)' },
    '.cm-activeLine': { backgroundColor: 'var(--scr-active-line)' },
    '.cm-gutters': {
      backgroundColor: 'var(--scr)',
      color: 'var(--scr-num)',
      border: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 6px 0 14px', minWidth: '34px' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--scr-ink)' },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'rgba(110, 176, 245, 0.16)',
      outline: '1px solid var(--scr-line)',
      color: 'inherit',
    },
    '.cm-nonmatchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: 'transparent',
      outline: '1px solid var(--scr-danger)',
    },
    '.cm-errorLine': { backgroundColor: 'var(--scr-danger-line)' },
    '.cm-lintRange-error': {
      backgroundImage: 'none',
      textDecoration: 'underline wavy var(--scr-danger)',
      textDecorationSkipInk: 'none',
      textUnderlineOffset: '3px',
    },
    '.cm-lintPoint-error:after': { borderBottomColor: 'var(--scr-danger)' },
    '.cm-gutter-lint': { width: '14px' },
    '.cm-lint-marker': { width: '10px', height: '10px' },
    '.cm-tooltip': {
      backgroundColor: 'var(--scr-3)',
      color: 'var(--scr-ink)',
      border: '1px solid var(--scr-line)',
      borderRadius: '8px',
      fontFamily: 'var(--font-ui)',
      fontSize: '14px',
      boxShadow: 'var(--shadow-pop)',
      overflow: 'hidden',
    },
    '.cm-tooltip-lint': { padding: '0' },
    '.cm-diagnostic': { padding: '6px 10px', borderLeft: 'none' },
    '.cm-diagnostic-error': { borderLeft: '3px solid var(--scr-danger)' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-mono)', maxHeight: '14em' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li': { padding: '2px 10px', lineHeight: '1.6' },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      backgroundColor: 'var(--scr-3)',
      color: 'var(--scr-ink)',
    },
    '.cm-completionDetail': { color: 'var(--scr-dim)', fontStyle: 'normal', marginLeft: '6px' },
    '.cm-completionMatchedText': { textDecoration: 'none', color: 'var(--sun)' },
    '.cm-completionInfo': { padding: '6px 10px', maxWidth: '280px', lineHeight: '1.45' },
    '.cm-hint': { padding: '6px 10px', maxWidth: '300px', lineHeight: '1.45' },
    '.cm-hint b': { fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--tok-variable)' },
    '.cm-panels': { backgroundColor: 'var(--scr-2)', color: 'var(--scr-ink)' },
  },
  { dark: true },
)
