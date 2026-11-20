"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCAL_BATCH_SIZE = void 0;
exports.takeVisibleSlice = takeVisibleSlice;
exports.hasMoreVisible = hasMoreVisible;
exports.LOCAL_BATCH_SIZE = 20;
/** 返回截至当前已渲染数量的累计可见列表；后端数组始终保持原顺序。 */
function takeVisibleSlice(items, renderedCount, batchSize = exports.LOCAL_BATCH_SIZE) {
    return items.slice(0, Math.min(renderedCount + batchSize, items.length));
}
function hasMoreVisible(total, renderedCount) {
    return renderedCount < total;
}
