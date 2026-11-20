import { getApiBaseUrl } from '../config/environment';
import type { PublicCategory, PublicProductDetail, PublicProductSummary } from '../types/catalog';
import { mergeCategoryPreview } from '../utils/preview';
import type { ApiResult } from '../utils/result';
import { createRequestClient, type RequestClient } from './request';
import { wxTransport } from './wx-transport';

export const PREVIEW_CATEGORY_LIMIT = 3;
export const PREVIEW_PRODUCT_LIMIT = 4;
export const PREVIEW_LOAD_FAILED_MESSAGE = '分类产品预览加载失败，请稍后重试';
export const SEARCH_LOAD_FAILED_MESSAGE = '搜索失败，请稍后重试';

export interface CatalogApi {
  getCategoryTree(): Promise<ApiResult<PublicCategory[]>>;
  getCategoryProducts(categoryId: number): Promise<ApiResult<PublicProductSummary[]>>;
  getCategoryPreview(categoryIds: number[]): Promise<ApiResult<PublicProductSummary[]>>;
  searchProducts(keyword: string): Promise<ApiResult<PublicProductSummary[]>>;
  getProductDetail(productId: number): Promise<ApiResult<PublicProductDetail>>;
}

export function createCatalogApi(request: RequestClient): CatalogApi {
  function categoryProductsPath(categoryId: number): string {
    return `/api/v1/categories/${categoryId}/products`;
  }

  return {
    getCategoryTree: () => request<PublicCategory[]>('/api/v1/categories'),

    getCategoryProducts: (categoryId: number) =>
      request<PublicProductSummary[]>(categoryProductsPath(categoryId)),

    searchProducts: (keyword: string) =>
      request<PublicProductSummary[]>(`/api/v1/products/search?q=${encodeURIComponent(keyword)}`),

    getProductDetail: (productId: number) => request<PublicProductDetail>(`/api/v1/products/${productId}`),

    async getCategoryPreview(categoryIds: number[]): Promise<ApiResult<PublicProductSummary[]>> {
      const sourceIds = categoryIds.slice(0, PREVIEW_CATEGORY_LIMIT);
      if (sourceIds.length === 0) {
        return { kind: 'empty' };
      }

      const results = await Promise.all(
        sourceIds.map((id) => request<PublicProductSummary[]>(categoryProductsPath(id))),
      );
      const usable = results.filter(
        (result): result is Extract<ApiResult<PublicProductSummary[]>, { kind: 'success' | 'empty' }> =>
          result.kind === 'success' || result.kind === 'empty',
      );
      const hasFailure = results.some((result) => result.kind === 'failure' || result.kind === 'notFound');
      const batches = usable.map((result) => (result.kind === 'success' ? result.data : []));
      const preview = mergeCategoryPreview(batches, PREVIEW_PRODUCT_LIMIT);

      if (preview.length > 0) {
        return { kind: 'success', data: preview };
      }
      if (hasFailure) {
        return { kind: 'failure', message: PREVIEW_LOAD_FAILED_MESSAGE };
      }
      return { kind: 'empty' };
    },
  };
}

export const catalogApi: CatalogApi = createCatalogApi(createRequestClient(wxTransport, getApiBaseUrl()));
