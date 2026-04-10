export const palette = {
  bg:         '#000000',
  bgPanel:    '#000000',
  fg:         '#e6fff0',
  fgDim:      '#7a9585',
  fgMute:     '#3d4f44',
  phosphor:   '#4aff7a',
  phosphorD:  '#2bc957',
  alert:      '#ff3b3b',
} as const;

export type PaletteKey = keyof typeof palette;
