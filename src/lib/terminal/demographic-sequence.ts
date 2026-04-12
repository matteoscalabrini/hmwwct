/**
 * Builds a deterministic sequence of person variants.
 * 0 = adult, 1 = child, 2 = casualty
 */
export function buildSequence(
  total: number,
  childRatio: number,
  casualtyRatio: number
): Uint8Array {
  const out = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const h = ((i * 2654435761) >>> 0) / 0xffffffff;
    if (h < casualtyRatio) out[i] = 2;
    else if (h < casualtyRatio + childRatio) out[i] = 1;
    else out[i] = 0;
  }
  return out;
}
