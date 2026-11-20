import { catalogApi } from '../../api/catalog';
import { getApiBaseUrl } from '../../config/environment';
import type { PublicProductSummary } from '../../types/catalog';
import { getCategoryFilterOptions } from '../../utils/app-state';
import { hasMoreVisible, LOCAL_BATCH_SIZE, takeVisibleSlice } from '../../utils/batching';
import {
  ALL_CATEGORIES,
  filterProductsByCategory,
  toProductCategoryIds,
  type CategoryFilterOption,
} from '../../utils/category';
import { toProductCards, type ProductCardData } from '../../utils/product';
import { createLatestRequestGuard } from '../../utils/race';

type ListState = 'loading' | 'ready' | 'empty' | 'error';

interface ListData {
  categoryId: number;
  categoryName: string;
  state: ListState;
  errorMessage: string;
  filterOptions: CategoryFilterOption[];
  allFilterId: number;
  activeFilterId: number;
  allProducts: PublicProductSummary[];
  renderedCount: number;
  visibleProducts: ProductCardData[];
  hasMore: boolean;
  totalCount: number;
}

Page({
  requestGuard: createLatestRequestGuard(),

  data: {
    categoryId: 0,
    categoryName: '',
    state: 'loading',
    errorMessage: '',
    filterOptions: [],
    allFilterId: ALL_CATEGORIES,
    activeFilterId: ALL_CATEGORIES,
    allProducts: [],
    renderedCount: 0,
    visibleProducts: [],
    hasMore: false,
    totalCount: 0,
  } as ListData,

  onLoad(options: Record<string, string | undefined>) {
    this.setData({
      categoryId: Number(options.categoryId ?? 0),
      categoryName: options.categoryName ?? '',
    });
    void this.loadProducts();
  },

  async loadProducts(): Promise<void> {
    const token = this.requestGuard.begin();
    this.setData({
      state: 'loading',
      errorMessage: '',
      activeFilterId: ALL_CATEGORIES,
      allProducts: [],
      renderedCount: 0,
      visibleProducts: [],
      hasMore: false,
      totalCount: 0,
    });

    const result = await catalogApi.getCategoryProducts(this.data.categoryId);
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
    const knownOptions = getCategoryFilterOptions(this.data.categoryId);
    const filterOptions =
      knownOptions.length > 0
        ? knownOptions
        : toProductCategoryIds(allProducts).map((id) => ({ id, name: `分类 ${id}` }));
    this.setData({ allProducts, filterOptions });
    this.applyFilter(ALL_CATEGORIES);
  },

  applyFilter(filterId: number): void {
    const filtered = filterProductsByCategory(this.data.allProducts, filterId);
    const visibleProducts = takeVisibleSlice(filtered, 0);
    this.setData({
      activeFilterId: filterId,
      renderedCount: 0,
      visibleProducts: toProductCards(visibleProducts, getApiBaseUrl()),
      hasMore: hasMoreVisible(filtered.length, 0),
      totalCount: filtered.length,
      state: filtered.length > 0 ? 'ready' : 'empty',
    });
  },

  onFilterSelect(event: { currentTarget: { dataset: { id: number | string } } }): void {
    const filterId = Number(event.currentTarget.dataset.id ?? ALL_CATEGORIES);
    if (filterId === this.data.activeFilterId) {
      return;
    }
    this.applyFilter(filterId);
  },

  onReachBottom(): void {
    if (!this.data.hasMore) {
      return;
    }
    const filtered = filterProductsByCategory(this.data.allProducts, this.data.activeFilterId);
    const renderedCount = this.data.renderedCount + LOCAL_BATCH_SIZE;
    const visibleProducts = takeVisibleSlice(filtered, renderedCount);
    this.setData({
      renderedCount,
      visibleProducts: toProductCards(visibleProducts, getApiBaseUrl()),
      hasMore: hasMoreVisible(filtered.length, renderedCount),
    });
  },

  onRetry(): void {
    void this.loadProducts();
  },

  onProductSelect(event: { detail: { id: number } }): void {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.detail.id}` });
  },
});
