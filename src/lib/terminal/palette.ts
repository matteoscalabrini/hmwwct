export const palette = {
  bg:         '#000000',
  bgPanel:    'rgba(0, 0, 0, 0.88)',
  fg:         '#f5f5f5',
  fgDim:      '#9a9a9a',
  fgMute:     '#3d3d3d',
  accent:   '#ffffff',
  accentD:  '#b3b3b3',
  alert:      '#ffffff',
} as const;

export type PaletteKey = keyof typeof palette;
