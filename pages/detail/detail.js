"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catalog_1 = require("../../api/catalog");
const environment_1 = require("../../config/environment");
const detail_1 = require("../../utils/detail");
const race_1 = require("../../utils/race");
Page({
    requestGuard: (0, race_1.createLatestRequestGuard)(),
    data: {
        productId: 0,
        state: 'loading',
        errorMessage: '',
        detail: null,
    },
    onLoad(options) {
        this.setData({ productId: Number(options.id ?? 0) });
        void this.loadDetail();
    },
    async loadDetail() {
        const token = this.requestGuard.begin();
        this.setData({ state: 'loading', errorMessage: '', detail: null });
        const result = await catalog_1.catalogApi.getProductDetail(this.data.productId);
        if (!this.requestGuard.isLatest(token)) {
            return;
        }
        if (result.kind === 'notFound' || result.kind === 'empty') {
            this.setData({ state: 'notFound', detail: null });
            return;
        }
        if (result.kind === 'failure') {
            this.setData({ state: 'error', errorMessage: result.message, detail: null });
            return;
        }
        this.setData({
            state: 'ready',
            detail: (0, detail_1.toProductDetailView)(result.data, (0, environment_1.getApiBaseUrl)()),
        });
    },
    onRetry() {
        void this.loadDetail();
    },
    onBack() {
        wx.navigateBack();
    },
});
