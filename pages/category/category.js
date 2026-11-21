"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catalog_1 = require("../../api/catalog");
const environment_1 = require("../../config/environment");
const app_state_1 = require("../../utils/app-state");
const category_1 = require("../../utils/category");
const product_1 = require("../../utils/product");
const race_1 = require("../../utils/race");
const url_1 = require("../../utils/url");
const REVERSE_HIGHLIGHT_DELAY = 50;
const PROGRAMMATIC_SCROLL_WINDOW = 300;
function toProductRows(products, baseUrl) {
    return products.map((product) => {
        const specs = product.specifications ?? [];
        const priceDisplay = specs.length > 0 ? specs[0].priceDisplay : '';
        return {
            id: product.id,
            imageUrl: (0, url_1.resolveImageUrl)(product.mainImageUrl, baseUrl),
            name: product.name,
            specSummary: specs.map((spec) => spec.name).join('/'),
            priceDisplay,
            showCurrency: priceDisplay !== '' && priceDisplay !== product_1.NEGOTIABLE_PRICE,
        };
    });
}
Page({
    requestGuard: (0, race_1.createLatestRequestGuard)(),
    groupGuards: {},
    productCache: {},
    groupOffsets: [],
    listScrollTop: 0,
    ignoreScrollUntil: 0,
    scrollTimer: undefined,
    data: {
        firstLevel: [],
        activeFirstId: 0,
        groups: [],
        activeGroupAnchor: '',
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
    setGroupPatch(index, patch) {
        const updates = {};
        Object.keys(patch).forEach((key) => {
            const value = patch[key];
            if (value !== undefined) {
                updates[`groups[${index}].${key}`] = value;
            }
        });
        this.setData(updates);
    },
    measureGroupOffsets() {
        const query = wx.createSelectorQuery();
        query.selectAll('.product-group').boundingClientRect();
        query.select('#group-list').boundingClientRect();
        query.exec((result) => {
            const rects = result[0];
            const list = result[1];
            if (!list || !rects || rects.length !== this.data.groups.length) {
                return;
            }
            const scrollTop = this.listScrollTop;
            this.groupOffsets = rects.map((rect) => rect.top - list.top + scrollTop);
        });
    },
    loadPrimary(primaryId) {
        this.data.groups
            .filter((group) => group.parentId === primaryId)
            .forEach((group) => {
            void this.loadGroup(group.categoryId);
        });
    },
    async loadTree() {
        const token = this.requestGuard.begin();
        this.setData({ state: 'loading', errorMessage: '', firstLevel: [], groups: [], activeGroupAnchor: '' });
        const result = await catalog_1.catalogApi.getCategoryTree();
        if (!this.requestGuard.isLatest(token)) {
            return;
        }
        if (result.kind !== 'success' || result.data.length === 0) {
            this.setData({
                state: result.kind === 'failure' ? 'error' : 'empty',
                errorMessage: result.kind === 'failure' ? result.message : '',
            });
            return;
        }
        const tree = result.data;
        const firstLevel = (0, category_1.toFirstLevelCategories)(tree);
        const groups = [];
        tree.forEach((primary) => {
            const options = (0, category_1.toSecondLevelFilters)(tree, primary.id);
            (0, app_state_1.setCategoryFilterOptions)(primary.id, options);
            const sources = options.length > 0 ? options : [{ id: primary.id, name: primary.name }];
            sources.forEach((source) => {
                groups.push({
                    id: `group-${source.id}`,
                    categoryId: source.id,
                    parentId: primary.id,
                    name: source.name,
                    state: 'idle',
                    message: '',
                    products: [],
                });
            });
        });
        const activeFirstId = firstLevel[0].id;
        this.setData({ firstLevel, groups, activeFirstId, state: 'ready' });
        setTimeout(() => this.measureGroupOffsets(), 0);
        this.loadPrimary(activeFirstId);
    },
    async loadGroup(categoryId, force = false) {
        const index = this.data.groups.findIndex((group) => group.categoryId === categoryId);
        if (index < 0) {
            return;
        }
        if (!force && ['loading', 'success', 'empty', 'error'].includes(this.data.groups[index].state)) {
            return;
        }
        const cached = this.productCache[categoryId];
        if (cached) {
            this.setGroupPatch(index, {
                state: cached.length > 0 ? 'success' : 'empty',
                message: '',
                products: cached,
            });
            return;
        }
        let guard = this.groupGuards[categoryId];
        if (!guard) {
            guard = (0, race_1.createLatestRequestGuard)();
            this.groupGuards[categoryId] = guard;
        }
        const token = guard.begin();
        this.setGroupPatch(index, { state: 'loading', message: '', products: [] });
        const result = await catalog_1.catalogApi.getCategoryProducts(categoryId);
        if (!guard.isLatest(token)) {
            return;
        }
        if (result.kind === 'success' || result.kind === 'empty') {
            const products = result.kind === 'success' ? toProductRows(result.data, (0, environment_1.getApiBaseUrl)()) : [];
            this.productCache[categoryId] = products;
            this.setGroupPatch(index, {
                state: products.length > 0 ? 'success' : 'empty',
                message: '',
                products,
            });
        }
        else {
            this.setGroupPatch(index, {
                state: 'error',
                message: result.kind === 'failure' ? result.message : '分类不存在或已下架',
                products: [],
            });
        }
        setTimeout(() => this.measureGroupOffsets(), 0);
    },
    onFirstSelect(event) {
        const id = Number(event.currentTarget.dataset.id);
        const groupIndex = this.data.groups.findIndex((group) => group.parentId === id);
        this.ignoreScrollUntil = Date.now() + PROGRAMMATIC_SCROLL_WINDOW;
        this.setData({ activeFirstId: id, activeGroupAnchor: '' });
        setTimeout(() => {
            if (groupIndex >= 0) {
                this.setData({ activeGroupAnchor: this.data.groups[groupIndex].id });
            }
            this.measureGroupOffsets();
        }, 0);
        this.loadPrimary(id);
    },
    onListScroll(event) {
        const scrollTop = event.detail.scrollTop;
        this.listScrollTop = scrollTop;
        if (Date.now() < this.ignoreScrollUntil) {
            return;
        }
        if (this.scrollTimer !== undefined) {
            clearTimeout(this.scrollTimer);
        }
        this.scrollTimer = setTimeout(() => {
            this.scrollTimer = undefined;
            this.updateActiveByScroll(scrollTop);
        }, REVERSE_HIGHLIGHT_DELAY);
    },
    updateActiveByScroll(scrollTop) {
        if (this.groupOffsets.length === 0) {
            return;
        }
        let index = 0;
        for (let i = 0; i < this.groupOffsets.length; i += 1) {
            if (this.groupOffsets[i] <= scrollTop + 8) {
                index = i;
            }
            else {
                break;
            }
        }
        const group = this.data.groups[index];
        if (!group || group.parentId === this.data.activeFirstId) {
            return;
        }
        this.setData({ activeFirstId: group.parentId });
        this.loadPrimary(group.parentId);
    },
    onRetryGroup(event) {
        const id = Number(event.currentTarget.dataset.id);
        void this.loadGroup(id, true);
    },
    onRetry() {
        void this.loadTree();
    },
    onSearchTap() {
        (0, app_state_1.setSearchKeyword)('');
        wx.navigateTo({ url: '/pages/search/search' });
    },
    onProductSelect(event) {
        wx.navigateTo({ url: `/pages/detail/detail?id=${event.detail.id}` });
    },
});
