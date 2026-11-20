"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLatestRequestGuard = createLatestRequestGuard;
/** 每次请求开始取得新令牌，只接受最新令牌对应的响应。 */
function createLatestRequestGuard() {
    let latest = 0;
    return {
        begin() {
            latest += 1;
            return latest;
        },
        isLatest(token) {
            return token === latest;
        },
    };
}
