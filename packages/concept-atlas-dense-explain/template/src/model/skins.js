/**
 * Skin registry — single source of truth for available UI palettes.
 * Each skin must have matching `[data-skin="<id>"][data-theme="dark|light"]`
 * variable blocks in src/styles/skins.css.
 */
export const SKINS = [
  {
    id: 'aurora',
    label: 'Aurora · 极光',
    swatch: { dark: '#0f172a', light: '#f6f7f9', accent: '#38bdf8' }
  },
  {
    id: 'ember',
    label: 'Ember · 炉火',
    swatch: { dark: '#1c1812', light: '#f6f1e7', accent: '#d99a4e' }
  }
];

export const DEFAULT_SKIN = 'aurora';

export const SKIN_IDS = new Set(SKINS.map(skin => skin.id));

export function normalizeSkin(value) {
  return SKIN_IDS.has(value) ? value : null;
}

/**
 * Component style packs — the `[data-style]` axis. A pack switches the
 * component grammar (marginalia vs boxed cards); palettes stay independent.
 * Every pack must have matching `[data-style="<id>"]` rules in
 * src/styles/concept-explain.css.
 */
export const COMPONENT_STYLES = [
  { id: 'manuscript', label: 'Manuscript · 评注手稿' },
  { id: 'classic', label: 'Classic · 经典卡片' },
  { id: 'shadcn', label: 'shadcn · 极简界面' },
  { id: 'elastic', label: 'Elastic · 观测面板' }
];

export const DEFAULT_STYLE = 'manuscript';

export const STYLE_IDS = new Set(COMPONENT_STYLES.map(style => style.id));

export function normalizeStyle(value) {
  return STYLE_IDS.has(value) ? value : null;
}
