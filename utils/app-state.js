"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppGlobalData = getAppGlobalData;
exports.setSearchKeyword = setSearchKeyword;
exports.setCategoryFilterOptions = setCategoryFilterOptions;
exports.getCategoryFilterOptions = getCategoryFilterOptions;
function getAppGlobalData() {
    return getApp().globalData;
}
function setSearchKeyword(keyword) {
    getAppGlobalData().searchKeyword = keyword;
}
function setCategoryFilterOptions(categoryId, options) {
    getAppGlobalData().filterOptionsByCategory[categoryId] = options;
}
function getCategoryFilterOptions(categoryId) {
    return getAppGlobalData().filterOptionsByCategory[categoryId] ?? [];
}
