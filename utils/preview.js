"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCategoryPreview = mergeCategoryPreview;
/** 按分类顺序合并产品预览，按 id 去重，不重排后端结果。 */
function mergeCategoryPreview(batches, limit) {
    if (limit <= 0) {
        return [];
    }
    const seen = new Set();
    const merged = [];
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
