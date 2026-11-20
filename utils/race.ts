export interface LatestRequestGuard {
  begin(): number;
  isLatest(token: number): boolean;
}

/** 每次请求开始取得新令牌，只接受最新令牌对应的响应。 */
export function createLatestRequestGuard(): LatestRequestGuard {
  let latest = 0;

  return {
    begin() {
      latest += 1;
      return latest;
    },
    isLatest(token: number) {
      return token === latest;
    },
  };
}
