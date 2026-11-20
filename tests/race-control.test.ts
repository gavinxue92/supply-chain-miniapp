import { describe, expect, it } from 'vitest';
import { createLatestRequestGuard } from '../utils/race';

describe('竞态控制', () => {
  it('只接受最新一次分类请求的响应', () => {
    const guard = createLatestRequestGuard();

    const older = guard.begin();
    const newer = guard.begin();

    expect(guard.isLatest(older)).toBe(false);
    expect(guard.isLatest(newer)).toBe(true);
  });

  it('新的分类请求开始后，前一次响应变为过期', () => {
    const guard = createLatestRequestGuard();

    const first = guard.begin();
    expect(guard.isLatest(first)).toBe(true);

    const second = guard.begin();
    expect(guard.isLatest(first)).toBe(false);
    expect(guard.isLatest(second)).toBe(true);
  });
});
