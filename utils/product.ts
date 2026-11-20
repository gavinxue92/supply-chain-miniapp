import type { PublicProductSummary } from '../types/catalog';
import { resolveImageUrl } from './url';

export const NEGOTIABLE_PRICE = '面议';

/** 规格是咨询选项；priceDisplay 必须原样展示，不做价格格式化。 */
export interface ProductSpecView {
  name: string;
  priceDisplay: string;
  isNegotiable: boolean;
}

/** 产品卡展示数据；图片地址已与当前环境基址拼接。 */
export interface ProductCardData {
  id: number;
  imageUrl: string;
  name: string;
  specifications: ProductSpecView[];
  notice: string;
}

export function toSpecViews(specifications: PublicProductSummary['specifications']): ProductSpecView[] {
  return specifications.map((spec) => ({
    name: spec.name,
    priceDisplay: spec.priceDisplay,
    isNegotiable: spec.priceDisplay === NEGOTIABLE_PRICE,
  }));
}

export function toProductCardData(product: PublicProductSummary, baseUrl: string): ProductCardData {
  return {
    id: product.id,
    imageUrl: resolveImageUrl(product.mainImageUrl, baseUrl),
    name: product.name,
    specifications: toSpecViews(product.specifications),
    notice: product.referencePriceNotice,
  };
}

export function toProductCards(products: PublicProductSummary[], baseUrl: string): ProductCardData[] {
  return products.map((product) => toProductCardData(product, baseUrl));
}
