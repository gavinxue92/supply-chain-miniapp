export const SEARCH_MAX_LENGTH = 120;
export const SEARCH_DEBOUNCE_MS = 300;

/** 搜索词只做首尾去空格与长度截断；后端排序与匹配规则不在本地重做。 */
export function normalizeSearchKeyword(raw: string): string {
  return raw.trim().slice(0, SEARCH_MAX_LENGTH).trim();
}

export interface DebouncedAction<T> {
  (value: T): void;
  cancel(): void;
}

/** 输入防抖：只把最后一次输入交给搜索动作。 */
export function debounce<T>(action: (value: T) => void, waitMs: number): DebouncedAction<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (value: T) => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      action(value);
    }, waitMs);
  };

  debounced.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = undefined;
  };

  return debounced;
}
