"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEGOTIABLE_PRICE = void 0;
exports.toSpecViews = toSpecViews;
exports.toProductCardData = toProductCardData;
exports.toProductCards = toProductCards;
const url_1 = require("./url");
exports.NEGOTIABLE_PRICE = '面议';
function toSpecViews(specifications) {
    return specifications.map((spec) => ({
        name: spec.name,
        priceDisplay: spec.priceDisplay,
        isNegotiable: spec.priceDisplay === exports.NEGOTIABLE_PRICE,
    }));
}
function toProductCardData(product, baseUrl) {
    return {
        id: product.id,
        imageUrl: (0, url_1.resolveImageUrl)(product.mainImageUrl, baseUrl),
        name: product.name,
        specifications: toSpecViews(product.specifications),
        notice: product.referencePriceNotice,
    };
}
function toProductCards(products, baseUrl) {
    return products.map((product) => toProductCardData(product, baseUrl));
}
