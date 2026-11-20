export const LOCAL_BATCH_SIZE = 20;

/** 返回截至当前已渲染数量的累计可见列表；后端数组始终保持原顺序。 */
export function takeVisibleSlice<T>(items: T[], renderedCount: number, batchSize = LOCAL_BATCH_SIZE): T[] {
  return items.slice(0, Math.min(renderedCount + batchSize, items.length));
}

export function hasMoreVisible(total: number, renderedCount: number): boolean {
  return renderedCount < total;
}
