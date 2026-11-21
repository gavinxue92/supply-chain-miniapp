"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catalog_1 = require("../../api/catalog");
const environment_1 = require("../../config/environment");
const app_state_1 = require("../../utils/app-state");
const product_1 = require("../../utils/product");
const race_1 = require("../../utils/race");
const search_1 = require("../../utils/search");
const HISTORY_STORAGE_KEY = 'miniapp_search_history';
const HISTORY_LIMIT = 10;
Page({
    requestGuard: (0, race_1.createLatestRequestGuard)(),
    debouncedSearch: undefined,
    data: {
        keyword: '',
        submittedKeyword: '',
        state: 'idle',
        products: [],
        errorMessage: '',
        history: [],
    },
    onLoad(options) {
        this.debouncedSearch = (0, search_1.debounce)((value) => {
            void this.runSearch(value);
        }, search_1.SEARCH_DEBOUNCE_MS);
        let history = [];
        try {
            const stored = wx.getStorageSync(HISTORY_STORAGE_KEY);
            if (Array.isArray(stored)) {
                history = stored.filter((item) => typeof item === 'string');
            }
        }
        catch {
            history = [];
        }
        this.setData({ history });
        const keyword = options.keyword ?? (0, app_state_1.getAppGlobalData)().searchKeyword ?? '';
        this.setData({ keyword });
        if ((0, search_1.normalizeSearchKeyword)(keyword)) {
            void this.runSearch(keyword);
        }
    },
    onShow() {
        const incoming = (0, search_1.normalizeSearchKeyword)((0, app_state_1.getAppGlobalData)().searchKeyword);
        if (incoming && incoming !== this.data.submittedKeyword) {
            this.setData({ keyword: incoming });
            void this.runSearch(incoming);
        }
    },
    onHide() {
        this.debouncedSearch?.cancel();
    },
    onUnload() {
        this.debouncedSearch?.cancel();
    },
    async runSearch(rawKeyword) {
        const keyword = (0, search_1.normalizeSearchKeyword)(rawKeyword);
        if (!keyword) {
            this.setData({ submittedKeyword: '', products: [], state: 'empty', errorMessage: '' });
            return;
        }
        const token = this.requestGuard.begin();
        this.setData({ keyword, submittedKeyword: keyword, state: 'loading', products: [], errorMessage: '' });
        (0, app_state_1.setSearchKeyword)(keyword);
        const result = await catalog_1.catalogApi.searchProducts(keyword);
        if (!this.requestGuard.isLatest(token)) {
            return;
        }
        this.saveHistory(keyword);
        if (result.kind === 'success') {
            this.setData({ products: (0, product_1.toProductCards)(result.data, (0, environment_1.getApiBaseUrl)()), state: 'ready' });
            return;
        }
        if (result.kind === 'empty') {
            this.setData({ products: [], state: 'empty' });
            return;
        }
        this.setData({
            products: [],
            state: 'error',
            errorMessage: result.kind === 'failure' ? result.message : catalog_1.SEARCH_LOAD_FAILED_MESSAGE,
        });
    },
    onKeywordInput(event) {
        this.setData({ keyword: event.detail.value });
        this.debouncedSearch?.(event.detail.value);
    },
    onSearchSubmit(event) {
        this.debouncedSearch?.cancel();
        void this.runSearch(event.detail.keyword);
    },
    onClear() {
        this.debouncedSearch?.cancel();
        (0, app_state_1.setSearchKeyword)('');
        this.setData({ keyword: '', submittedKeyword: '', products: [], state: 'idle', errorMessage: '' });
    },
    saveHistory(keyword) {
        const history = [keyword, ...this.data.history.filter((item) => item !== keyword)].slice(0, HISTORY_LIMIT);
        this.setData({ history });
        try {
            wx.setStorageSync(HISTORY_STORAGE_KEY, history);
        }
        catch {
            wx.showToast({ title: '搜索历史保存失败', icon: 'none' });
        }
    },
    onHistorySelect(event) {
        this.debouncedSearch?.cancel();
        void this.runSearch(event.currentTarget.dataset.value);
    },
    onClearHistory() {
        wx.showModal({
            title: '清除搜索历史',
            content: '确定要清除全部搜索历史吗？',
            success: (result) => {
                if (!result.confirm) {
                    return;
                }
                this.setData({ history: [] });
                try {
                    wx.removeStorageSync(HISTORY_STORAGE_KEY);
                }
                catch {
                    wx.showToast({ title: '搜索历史清除失败', icon: 'none' });
                }
                wx.showToast({ title: '搜索历史已清除', icon: 'none' });
            },
        });
    },
    onUnavailable() {
        wx.showToast({ title: '暂未开放', icon: 'none' });
    },
    onRetry() {
        void this.runSearch(this.data.submittedKeyword);
    },
    onBackHome() {
        this.debouncedSearch?.cancel();
        wx.switchTab({ url: '/pages/index/index' });
    },
    onProductSelect(event) {
        wx.navigateTo({ url: `/pages/detail/detail?id=${event.detail.id}` });
    },
});
