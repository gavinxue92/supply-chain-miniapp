"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogApi = exports.SEARCH_LOAD_FAILED_MESSAGE = exports.PREVIEW_LOAD_FAILED_MESSAGE = exports.PREVIEW_PRODUCT_LIMIT = exports.PREVIEW_CATEGORY_LIMIT = void 0;
exports.createCatalogApi = createCatalogApi;
const environment_1 = require("../config/environment");
const preview_1 = require("../utils/preview");
const request_1 = require("./request");
const wx_transport_1 = require("./wx-transport");
exports.PREVIEW_CATEGORY_LIMIT = 3;
exports.PREVIEW_PRODUCT_LIMIT = 4;
exports.PREVIEW_LOAD_FAILED_MESSAGE = '分类产品预览加载失败，请稍后重试';
exports.SEARCH_LOAD_FAILED_MESSAGE = '搜索失败，请稍后重试';
function createCatalogApi(request) {
    function categoryProductsPath(categoryId) {
        return `/api/v1/categories/${categoryId}/products`;
    }
    return {
        getCategoryTree: () => request('/api/v1/categories'),
        getCategoryProducts: (categoryId) => request(categoryProductsPath(categoryId)),
        searchProducts: (keyword) => request(`/api/v1/products/search?q=${encodeURIComponent(keyword)}`),
        getProductDetail: (productId) => request(`/api/v1/products/${productId}`),
        async getCategoryPreview(categoryIds) {
            const sourceIds = categoryIds.slice(0, exports.PREVIEW_CATEGORY_LIMIT);
            if (sourceIds.length === 0) {
                return { kind: 'empty' };
            }
            const results = await Promise.all(sourceIds.map((id) => request(categoryProductsPath(id))));
            const usable = results.filter((result) => result.kind === 'success' || result.kind === 'empty');
            const hasFailure = results.some((result) => result.kind === 'failure' || result.kind === 'notFound');
            const batches = usable.map((result) => (result.kind === 'success' ? result.data : []));
            const preview = (0, preview_1.mergeCategoryPreview)(batches, exports.PREVIEW_PRODUCT_LIMIT);
            if (preview.length > 0) {
                return { kind: 'success', data: preview };
            }
            if (hasFailure) {
                return { kind: 'failure', message: exports.PREVIEW_LOAD_FAILED_MESSAGE };
            }
            return { kind: 'empty' };
        },
    };
}
exports.catalogApi = createCatalogApi((0, request_1.createRequestClient)(wx_transport_1.wxTransport, (0, environment_1.getApiBaseUrl)()));
