import type { ContactDisplay, PublicProductDetail } from '../types/catalog';
import { toSpecViews, type ProductSpecView } from './product';
import { resolveImageUrl } from './url';

export interface ContactServiceView {
  displayName: string;
  wechatId?: string;
  qrImageUrl?: string;
  phone?: string;
}

export interface ContactCardView {
  services: ContactServiceView[];
}

export interface ProductDetailView {
  id: number;
  name: string;
  images: string[];
  detailHtml: string;
  specifications: ProductSpecView[];
  notice: string;
  contact?: ContactCardView;
}

const RICH_IMAGE_SRC = /(<img\b[^>]*\bsrc\s*=\s*)(["'])([^"']*)\2/gi;

/** 只重写后端富文本中 img 的相对 src，不执行脚本、不引入外链。 */
export function resolveRichTextImages(html: string, baseUrl: string): string {
  return html.replace(RICH_IMAGE_SRC, (_match, prefix: string, quote: string, path: string) => {
    const resolved = path.startsWith('/') ? resolveImageUrl(path, baseUrl) : path;
    return `${prefix}${quote}${resolved}${quote}`;
  });
}

/** 客服字段按后端顺序映射，缺失字段保持缺失，二维码拼接环境基址。 */
export function toContactCardView(contact: ContactDisplay, baseUrl: string): ContactCardView {
  return {
    services: contact.services.map((service) => ({
      displayName: service.displayName,
      ...(service.wechatId ? { wechatId: service.wechatId } : {}),
      ...(service.qrImageUrl ? { qrImageUrl: resolveImageUrl(service.qrImageUrl, baseUrl) } : {}),
      ...(service.phone ? { phone: service.phone } : {}),
    })),
  };
}

export function toProductDetailView(detail: PublicProductDetail, baseUrl: string): ProductDetailView {
  return {
    id: detail.id,
    name: detail.name,
    images: [detail.mainImageUrl, ...detail.galleryImageUrls].map((path) => resolveImageUrl(path, baseUrl)),
    detailHtml: resolveRichTextImages(detail.detailHtml, baseUrl),
    specifications: toSpecViews(detail.specifications),
    notice: detail.referencePriceNotice,
    ...(detail.contact ? { contact: toContactCardView(detail.contact, baseUrl) } : {}),
  };
}
