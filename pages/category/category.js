"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catalog_1 = require("../../api/catalog");
const environment_1 = require("../../config/environment");
const app_state_1 = require("../../utils/app-state");
const category_1 = require("../../utils/category");
const product_1 = require("../../utils/product");
const race_1 = require("../../utils/race");
Page({
    requestGuard: (0, race_1.createLatestRequestGuard)(),
    data: {
        tree: [],
        firstLevel: [],
        activeFirstId: 0,
        secondOptions: [],
        activeSecondId: category_1.ALL_CATEGORIES,
        allFilterId: category_1.ALL_CATEGORIES,
        allProducts: [],
        visibleProducts: [],
        state: 'loading',
        errorMessage: '',
    },
    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ active: 1 });
        }
    },
    onLoad() {
        void this.loadTree();
    },
    async loadTree() {
        const token = this.requestGuard.begin();
        this.setData({ state: 'loading', errorMessage: '', firstLevel: [], allProducts: [], visibleProducts: [] });
        const result = await catalog_1.catalogApi.getCategoryTree();
        if (!this.requestGuard.isLatest(token)) {
            return;
        }
        if (result.kind !== 'success' || result.data.length === 0) {
            this.setData({ state: result.kind === 'failure' ? 'error' : 'empty', errorMessage: result.kind === 'failure' ? result.message : '' });
            return;
        }
        const firstLevel = (0, category_1.toFirstLevelCategories)(result.data);
        const activeFirstId = firstLevel[0].id;
        const secondOptions = (0, category_1.toSecondLevelFilters)(result.data, activeFirstId);
        (0, app_state_1.setCategoryFilterOptions)(activeFirstId, secondOptions);
        this.setData({ tree: result.data, firstLevel, activeFirstId, secondOptions, activeSecondId: category_1.ALL_CATEGORIES });
        await this.loadProducts(activeFirstId, token);
    },
    async loadProducts(firstId, token) {
        const result = await catalog_1.catalogApi.getCategoryProducts(firstId);
        if (!this.requestGuard.isLatest(token)) {
            return;
        }
        if (result.kind !== 'success' && result.kind !== 'empty') {
            this.setData({
                state: 'error',
                errorMessage: result.kind === 'failure' ? result.message : '分类不存在或已下架',
            });
            return;
        }
        this.setData({ allProducts: result.kind === 'success' ? result.data : [] });
        this.applyFilter(category_1.ALL_CATEGORIES);
    },
    applyFilter(secondId) {
        const filtered = (0, category_1.filterProductsByCategory)(this.data.allProducts, secondId);
        this.setData({
            activeSecondId: secondId,
            visibleProducts: (0, product_1.toProductCards)(filtered, (0, environment_1.getApiBaseUrl)()),
            state: filtered.length > 0 ? 'ready' : 'empty',
        });
    },
    onFirstSelect(event) {
        const id = Number(event.currentTarget.dataset.id);
        if (id === this.data.activeFirstId) {
            return;
        }
        const secondOptions = (0, category_1.toSecondLevelFilters)(this.data.tree, id);
        (0, app_state_1.setCategoryFilterOptions)(id, secondOptions);
        this.setData({ activeFirstId: id, secondOptions, activeSecondId: category_1.ALL_CATEGORIES });
        void this.loadProducts(id, this.requestGuard.begin());
    },
    onSecondSelect(event) {
        const id = Number(event.currentTarget.dataset.id);
        if (id !== this.data.activeSecondId) {
            this.applyFilter(id);
        }
    },
    onSearchTap() {
        (0, app_state_1.setSearchKeyword)('');
        wx.navigateTo({ url: '/pages/search/search' });
    },
    onCaps() {
        wx.showToast({ title: '暂未开放', icon: 'none' });
    },
    onRetry() {
        void this.loadTree();
    },
    onProductSelect(event) {
        wx.navigateTo({ url: `/pages/detail/detail?id=${event.detail.id}` });
    },
});
