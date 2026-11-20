"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEARCH_DEBOUNCE_MS = exports.SEARCH_MAX_LENGTH = void 0;
exports.normalizeSearchKeyword = normalizeSearchKeyword;
exports.debounce = debounce;
exports.SEARCH_MAX_LENGTH = 120;
exports.SEARCH_DEBOUNCE_MS = 300;
/** 搜索词只做首尾去空格与长度截断；后端排序与匹配规则不在本地重做。 */
function normalizeSearchKeyword(raw) {
    return raw.trim().slice(0, exports.SEARCH_MAX_LENGTH).trim();
}
/** 输入防抖：只把最后一次输入交给搜索动作。 */
function debounce(action, waitMs) {
    let timer;
    const debounced = (value) => {
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
