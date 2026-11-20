import { catalogApi } from '../../api/catalog';
import { getApiBaseUrl } from '../../config/environment';
import type { PublicCategory, PublicProductSummary } from '../../types/catalog';
import { setCategoryFilterOptions, setSearchKeyword } from '../../utils/app-state';
import {
  ALL_CATEGORIES,
  filterProductsByCategory,
  toFirstLevelCategories,
  toSecondLevelFilters,
  type CategoryEntry,
  type CategoryFilterOption,
} from '../../utils/category';
import { toProductCards, type ProductCardData } from '../../utils/product';
import { createLatestRequestGuard } from '../../utils/race';

type CategoryState = 'loading' | 'ready' | 'empty' | 'error';

interface CategoryPageData {
  tree: PublicCategory[];
  firstLevel: CategoryEntry[];
  activeFirstId: number;
  secondOptions: CategoryFilterOption[];
  activeSecondId: number;
  allFilterId: number;
  allProducts: PublicProductSummary[];
  visibleProducts: ProductCardData[];
  state: CategoryState;
  errorMessage: string;
}

Page({
  requestGuard: createLatestRequestGuard(),

  data: {
    tree: [],
    firstLevel: [],
    activeFirstId: 0,
    secondOptions: [],
    activeSecondId: ALL_CATEGORIES,
    allFilterId: ALL_CATEGORIES,
    allProducts: [],
    visibleProducts: [],
    state: 'loading',
    errorMessage: '',
  } as CategoryPageData,

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 1 });
    }
  },

  onLoad() {
    void this.loadTree();
  },

  async loadTree(): Promise<void> {
    const token = this.requestGuard.begin();
    this.setData({ state: 'loading', errorMessage: '', firstLevel: [], allProducts: [], visibleProducts: [] });

    const result = await catalogApi.getCategoryTree();
    if (!this.requestGuard.isLatest(token)) {
      return;
    }
    if (result.kind !== 'success' || result.data.length === 0) {
      this.setData({ state: result.kind === 'failure' ? 'error' : 'empty', errorMessage: result.kind === 'failure' ? result.message : '' });
      return;
    }

    const firstLevel = toFirstLevelCategories(result.data);
    const activeFirstId = firstLevel[0].id;
    const secondOptions = toSecondLevelFilters(result.data, activeFirstId);
    setCategoryFilterOptions(activeFirstId, secondOptions);
    this.setData({ tree: result.data, firstLevel, activeFirstId, secondOptions, activeSecondId: ALL_CATEGORIES });
    await this.loadProducts(activeFirstId, token);
  },

  async loadProducts(firstId: number, token: number): Promise<void> {
    const result = await catalogApi.getCategoryProducts(firstId);
    if (!this.requestGuard.isLatest(token)) {
      return;
    }
    if (result.kind !== 'success' && result.kind !== 'empty') {
      this.setData({
        state: 'error',
        errorMessage: result.kind === 'failure' ? result.message : '分类不存在或已下架',
      });
      return;
    }
    this.setData({ allProducts: result.kind === 'success' ? result.data : [] });
    this.applyFilter(ALL_CATEGORIES);
  },

  applyFilter(secondId: number): void {
    const filtered = filterProductsByCategory(this.data.allProducts, secondId);
    this.setData({
      activeSecondId: secondId,
      visibleProducts: toProductCards(filtered, getApiBaseUrl()),
      state: filtered.length > 0 ? 'ready' : 'empty',
    });
  },

  onFirstSelect(event: { currentTarget: { dataset: { id: number } } }): void {
    const id = Number(event.currentTarget.dataset.id);
    if (id === this.data.activeFirstId) {
      return;
    }
    const secondOptions = toSecondLevelFilters(this.data.tree, id);
    setCategoryFilterOptions(id, secondOptions);
    this.setData({ activeFirstId: id, secondOptions, activeSecondId: ALL_CATEGORIES });
    void this.loadProducts(id, this.requestGuard.begin());
  },

  onSecondSelect(event: { currentTarget: { dataset: { id: number } } }): void {
    const id = Number(event.currentTarget.dataset.id);
    if (id !== this.data.activeSecondId) {
      this.applyFilter(id);
    }
  },

  onSearchTap(): void {
    setSearchKeyword('');
    wx.navigateTo({ url: '/pages/search/search' });
  },

  onCaps(): void {
    wx.showToast({ title: '暂未开放', icon: 'none' });
  },

  onRetry(): void {
    void this.loadTree();
  },

  onProductSelect(event: { detail: { id: number } }): void {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.detail.id}` });
  },
});
