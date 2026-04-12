const BITMAP = [
  [0, 1, 1, 0],
  [1, 1, 1, 1],
  [0, 1, 1, 0],
  [0, 1, 1, 0],
  [0, 1, 1, 0],
];

export function createSpriteSheet(colors: {
  adult: string;
  child: string;
  casualty: string;
}): OffscreenCanvas {
  const sheet = new OffscreenCanvas(12, 5);
  const ctx = sheet.getContext('2d')!;
  (['adult', 'child', 'casualty'] as const).forEach((variant, vi) => {
    ctx.fillStyle = colors[variant];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 4; x++) {
        if (BITMAP[y][x]) ctx.fillRect(vi * 4 + x, y, 1, 1);
      }
    }
  });
  return sheet;
}
