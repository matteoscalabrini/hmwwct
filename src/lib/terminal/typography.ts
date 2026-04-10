export const typography = {
  family: {
    display: 'Departure Mono',
    body:    'Ioskeley Mono',
  },
  size: {
    hero:  96,
    title: 32,
    label: 12,
    body:  15,
    data:  14,
  },
  lineHeight: {
    hero:  1.0,
    title: 1.1,
    label: 1.2,
    body:  1.55,
    data:  1.4,
  },
  tracking: {
    label: '0.12em',
  },
} as const;

export type TypeSize = keyof typeof typography.size;
