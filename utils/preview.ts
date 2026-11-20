import type { PublicProductSummary } from '../types/catalog';

/** 按分类顺序合并产品预览，按 id 去重，不重排后端结果。 */
export function mergeCategoryPreview(
  batches: PublicProductSummary[][],
  limit: number,
): PublicProductSummary[] {
  if (limit <= 0) {
    return [];
  }

  const seen = new Set<number>();
  const merged: PublicProductSummary[] = [];

  for (const batch of batches) {
    for (const product of batch) {
      if (seen.has(product.id)) {
        continue;
      }
      seen.add(product.id);
      merged.push(product);
      if (merged.length >= limit) {
        return merged;
      }
    }
  }

  return merged;
}
