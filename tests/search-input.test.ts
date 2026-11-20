import { afterEach, describe, expect, it, vi } from 'vitest';
import { debounce, SEARCH_MAX_LENGTH, normalizeSearchKeyword } from '../utils/search';

afterEach(() => {
  vi.useRealTimers();
});

describe('搜索结果页的搜索词校验', () => {
  it('搜索词去除首尾空格', () => {
    expect(normalizeSearchKeyword('  牛腩  ')).toBe('牛腩');
  });

  it('长度截断后不留尾随空格', () => {
    const raw = `${'蔬'.repeat(119)} ${'菜'.repeat(5)}`;
    expect(normalizeSearchKeyword(raw)).toBe('蔬'.repeat(119));
  });

  it('搜索词最多保留 120 字符', () => {
    const raw = '蔬'.repeat(SEARCH_MAX_LENGTH + 10);
    expect(normalizeSearchKeyword(raw)).toBe('蔬'.repeat(SEARCH_MAX_LENGTH));
    expect(normalizeSearchKeyword(raw)).toHaveLength(120);
  });

  it('空搜索词保持为空，不触发搜索请求', () => {
    expect(normalizeSearchKeyword('   ')).toBe('');
    expect(normalizeSearchKeyword('')).toBe('');
  });
});

describe('搜索结果页的输入防抖', () => {
  it('连续输入只在停止后执行一次，并使用最后一次搜索词', () => {
    vi.useFakeTimers();
    const action = vi.fn();
    const debounced = debounce(action, 300);

    debounced('牛');
    debounced('牛腩');
    vi.advanceTimersByTime(299);
    expect(action).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith('牛腩');
  });

  it('取消后不会执行待处理的搜索', () => {
    vi.useFakeTimers();
    const action = vi.fn();
    const debounced = debounce(action, 300);

    debounced('牛腩');
    debounced.cancel();
    vi.advanceTimersByTime(300);

    expect(action).not.toHaveBeenCalled();
  });
});
