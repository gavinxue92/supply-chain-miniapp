/** 分类树节点：二级节点的 children 恒为空数组。 */
export interface PublicCategory {
  id: number;
  name: string;
  sortOrder: number;
  children: PublicCategory[];
}

/** 规格是咨询选项，不是可购买 SKU；priceDisplay 必须原样展示。 */
export interface PublicProductSpec {
  name: string;
  referencePrice?: number;
  priceDisplay: string;
}

export interface PublicProductSummary {
  id: number;
  name: string;
  categoryId: number;
  mainImageUrl: string;
  specifications: PublicProductSpec[];
  referencePriceNotice: string;
}

export interface PublicContactService {
  displayName: string;
  wechatId?: string;
  qrImageUrl?: string;
  phone?: string;
}

export interface ContactDisplay {
  services: PublicContactService[];
}

export interface PublicProductDetail {
  id: number;
  name: string;
  categoryId: number;
  mainImageUrl: string;
  galleryImageUrls: string[];
  detailHtml: string;
  specifications: PublicProductSpec[];
  referencePriceNotice: string;
  contact?: ContactDisplay;
}
