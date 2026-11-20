"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRichTextImages = resolveRichTextImages;
exports.toContactCardView = toContactCardView;
exports.toProductDetailView = toProductDetailView;
const product_1 = require("./product");
const url_1 = require("./url");
const RICH_IMAGE_SRC = /(<img\b[^>]*\bsrc\s*=\s*)(["'])([^"']*)\2/gi;
/** 只重写后端富文本中 img 的相对 src，不执行脚本、不引入外链。 */
function resolveRichTextImages(html, baseUrl) {
    return html.replace(RICH_IMAGE_SRC, (_match, prefix, quote, path) => {
        const resolved = path.startsWith('/') ? (0, url_1.resolveImageUrl)(path, baseUrl) : path;
        return `${prefix}${quote}${resolved}${quote}`;
    });
}
/** 客服字段按后端顺序映射，缺失字段保持缺失，二维码拼接环境基址。 */
function toContactCardView(contact, baseUrl) {
    return {
        services: contact.services.map((service) => ({
            displayName: service.displayName,
            ...(service.wechatId ? { wechatId: service.wechatId } : {}),
            ...(service.qrImageUrl ? { qrImageUrl: (0, url_1.resolveImageUrl)(service.qrImageUrl, baseUrl) } : {}),
            ...(service.phone ? { phone: service.phone } : {}),
        })),
    };
}
function toProductDetailView(detail, baseUrl) {
    return {
        id: detail.id,
        name: detail.name,
        images: [detail.mainImageUrl, ...detail.galleryImageUrls].map((path) => (0, url_1.resolveImageUrl)(path, baseUrl)),
        detailHtml: resolveRichTextImages(detail.detailHtml, baseUrl),
        specifications: (0, product_1.toSpecViews)(detail.specifications),
        notice: detail.referencePriceNotice,
        ...(detail.contact ? { contact: toContactCardView(detail.contact, baseUrl) } : {}),
    };
}
