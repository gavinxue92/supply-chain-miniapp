import { describe, expect, it } from 'vitest';
import { hasMoreVisible, LOCAL_BATCH_SIZE, takeVisibleSlice } from '../utils/batching';

function products(count: number): number[] {
  return Array.from({ length: count }, (_, index) => 1001 + index);
}

describe('本地分批渲染', () => {
  it('首次渲染 20 条产品，触底后依次追加 20 条', () => {
    const all = products(45);
    expect(LOCAL_BATCH_SIZE).toBe(20);

    const first = takeVisibleSlice(all, 0);
    const second = takeVisibleSlice(all, first.length);
    const last = takeVisibleSlice(all, second.length);

    expect(first).toEqual(Array.from({ length: 20 }, (_, index) => 1001 + index));
    expect(second).toEqual(Array.from({ length: 40 }, (_, index) => 1001 + index));
    expect(last).toEqual(Array.from({ length: 45 }, (_, index) => 1001 + index));
  });

  it('所有产品渲染完毕后不再追加', () => {
    const all = products(45);
    expect(hasMoreVisible(all.length, 45)).toBe(false);
    expect(takeVisibleSlice(all, 45)).toEqual(takeVisibleSlice(all, 60));
  });

  it('空的产品列表没有可追加内容', () => {
    expect(takeVisibleSlice([], 0)).toEqual([]);
    expect(hasMoreVisible(0, 0)).toBe(false);
  });
});
