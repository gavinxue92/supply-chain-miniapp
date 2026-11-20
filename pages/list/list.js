"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catalog_1 = require("../../api/catalog");
const environment_1 = require("../../config/environment");
const app_state_1 = require("../../utils/app-state");
const batching_1 = require("../../utils/batching");
const category_1 = require("../../utils/category");
const product_1 = require("../../utils/product");
const race_1 = require("../../utils/race");
Page({
    requestGuard: (0, race_1.createLatestRequestGuard)(),
    data: {
        categoryId: 0,
        categoryName: '',
        state: 'loading',
        errorMessage: '',
        filterOptions: [],
        allFilterId: category_1.ALL_CATEGORIES,
        activeFilterId: category_1.ALL_CATEGORIES,
        allProducts: [],
        renderedCount: 0,
        visibleProducts: [],
        hasMore: false,
        totalCount: 0,
    },
    onLoad(options) {
        this.setData({
            categoryId: Number(options.categoryId ?? 0),
            categoryName: options.categoryName ?? '',
        });
        void this.loadProducts();
    },
    async loadProducts() {
        const token = this.requestGuard.begin();
        this.setData({
            state: 'loading',
            errorMessage: '',
            activeFilterId: category_1.ALL_CATEGORIES,
            allProducts: [],
            renderedCount: 0,
            visibleProducts: [],
            hasMore: false,
            totalCount: 0,
        });
        const result = await catalog_1.catalogApi.getCategoryProducts(this.data.categoryId);
        if (!this.requestGuard.isLatest(token)) {
            return;
        }
        if (result.kind !== 'success' && result.kind !== 'empty') {
            this.setData({
                state: 'error',
                errorMessage: result.kind === 'failure' ? result.message : '分类不存在或已下架，请返回分类首页',
            });
            return;
        }
        const allProducts = result.kind === 'success' ? result.data : [];
        const knownOptions = (0, app_state_1.getCategoryFilterOptions)(this.data.categoryId);
        const filterOptions = knownOptions.length > 0
            ? knownOptions
            : (0, category_1.toProductCategoryIds)(allProducts).map((id) => ({ id, name: `分类 ${id}` }));
        this.setData({ allProducts, filterOptions });
        this.applyFilter(category_1.ALL_CATEGORIES);
    },
    applyFilter(filterId) {
        const filtered = (0, category_1.filterProductsByCategory)(this.data.allProducts, filterId);
        const visibleProducts = (0, batching_1.takeVisibleSlice)(filtered, 0);
        this.setData({
            activeFilterId: filterId,
            renderedCount: 0,
            visibleProducts: (0, product_1.toProductCards)(visibleProducts, (0, environment_1.getApiBaseUrl)()),
            hasMore: (0, batching_1.hasMoreVisible)(filtered.length, 0),
            totalCount: filtered.length,
            state: filtered.length > 0 ? 'ready' : 'empty',
        });
    },
    onFilterSelect(event) {
        const filterId = Number(event.currentTarget.dataset.id ?? category_1.ALL_CATEGORIES);
        if (filterId === this.data.activeFilterId) {
            return;
        }
        this.applyFilter(filterId);
    },
    onReachBottom() {
        if (!this.data.hasMore) {
            return;
        }
        const filtered = (0, category_1.filterProductsByCategory)(this.data.allProducts, this.data.activeFilterId);
        const renderedCount = this.data.renderedCount + batching_1.LOCAL_BATCH_SIZE;
        const visibleProducts = (0, batching_1.takeVisibleSlice)(filtered, renderedCount);
        this.setData({
            renderedCount,
            visibleProducts: (0, product_1.toProductCards)(visibleProducts, (0, environment_1.getApiBaseUrl)()),
            hasMore: (0, batching_1.hasMoreVisible)(filtered.length, renderedCount),
        });
    },
    onRetry() {
        void this.loadProducts();
    },
    onProductSelect(event) {
        wx.navigateTo({ url: `/pages/detail/detail?id=${event.detail.id}` });
    },
});
