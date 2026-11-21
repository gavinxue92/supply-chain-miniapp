import { catalogApi } from '../../api/catalog';
import { getApiBaseUrl } from '../../config/environment';
import type { PublicProductSummary } from '../../types/catalog';
import { setCategoryFilterOptions, setSearchKeyword } from '../../utils/app-state';
import { toFirstLevelCategories, toSecondLevelFilters } from '../../utils/category';
import { NEGOTIABLE_PRICE } from '../../utils/product';
import { createLatestRequestGuard, type LatestRequestGuard } from '../../utils/race';
import { resolveImageUrl } from '../../utils/url';

type CategoryState = 'loading' | 'ready' | 'empty' | 'error';
type GroupState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface ProductRowView {
  id: number;
  imageUrl: string;
  name: string;
  specSummary: string;
  priceDisplay: string;
  showCurrency: boolean;
}

interface ProductGroupView {
  id: string;
  categoryId: number;
  parentId: number;
  name: string;
  state: GroupState;
  message: string;
  products: ProductRowView[];
}

interface CategoryPageData {
  firstLevel: Array<{ id: number; name: string }>;
  activeFirstId: number;
  groups: ProductGroupView[];
  activeGroupAnchor: string;
  state: CategoryState;
  errorMessage: string;
}

type GroupPatchValue = string | number | ProductRowView[];

const REVERSE_HIGHLIGHT_DELAY = 50;
const PROGRAMMATIC_SCROLL_WINDOW = 300;

function toProductRows(products: PublicProductSummary[], baseUrl: string): ProductRowView[] {
  return products.map((product) => {
    const specs = product.specifications ?? [];
    const priceDisplay = specs.length > 0 ? specs[0].priceDisplay : '';
    return {
      id: product.id,
      imageUrl: resolveImageUrl(product.mainImageUrl, baseUrl),
      name: product.name,
      specSummary: specs.map((spec) => spec.name).join('/'),
      priceDisplay,
      showCurrency: priceDisplay !== '' && priceDisplay !== NEGOTIABLE_PRICE,
    };
  });
}

Page({
  requestGuard: createLatestRequestGuard(),
  groupGuards: {} as Record<number, LatestRequestGuard>,
  productCache: {} as Record<number, ProductRowView[] | undefined>,
  groupOffsets: [] as number[],
  listScrollTop: 0,
  ignoreScrollUntil: 0,
  scrollTimer: undefined as ReturnType<typeof setTimeout> | undefined,

  data: {
    firstLevel: [],
    activeFirstId: 0,
    groups: [],
    activeGroupAnchor: '',
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

  setGroupPatch(index: number, patch: Partial<ProductGroupView>): void {
    const updates: Record<string, GroupPatchValue> = {};
    (Object.keys(patch) as Array<keyof ProductGroupView>).forEach((key) => {
      const value = patch[key];
      if (value !== undefined) {
        updates[`groups[${index}].${key}`] = value as GroupPatchValue;
      }
    });
    this.setData(updates);
  },

  measureGroupOffsets(): void {
    const query = wx.createSelectorQuery();
    query.selectAll('.product-group').boundingClientRect();
    query.select('#group-list').boundingClientRect();
    query.exec((result) => {
      const rects = result[0] as Array<{ top: number }> | null;
      const list = result[1] as { top: number } | null;
      if (!list || !rects || rects.length !== this.data.groups.length) {
        return;
      }
      const scrollTop = this.listScrollTop;
      this.groupOffsets = rects.map((rect) => rect.top - list.top + scrollTop);
    });
  },

  loadPrimary(primaryId: number): void {
    this.data.groups
      .filter((group) => group.parentId === primaryId)
      .forEach((group) => {
        void this.loadGroup(group.categoryId);
      });
  },

  async loadTree(): Promise<void> {
    const token = this.requestGuard.begin();
    this.setData({ state: 'loading', errorMessage: '', firstLevel: [], groups: [], activeGroupAnchor: '' });

    const result = await catalogApi.getCategoryTree();
    if (!this.requestGuard.isLatest(token)) {
      return;
    }
    if (result.kind !== 'success' || result.data.length === 0) {
      this.setData({
        state: result.kind === 'failure' ? 'error' : 'empty',
        errorMessage: result.kind === 'failure' ? result.message : '',
      });
      return;
    }

    const tree = result.data;
    const firstLevel = toFirstLevelCategories(tree);
    const groups: ProductGroupView[] = [];

    tree.forEach((primary) => {
      const options = toSecondLevelFilters(tree, primary.id);
      setCategoryFilterOptions(primary.id, options);
      const sources = options.length > 0 ? options : [{ id: primary.id, name: primary.name }];
      sources.forEach((source) => {
        groups.push({
          id: `group-${source.id}`,
          categoryId: source.id,
          parentId: primary.id,
          name: source.name,
          state: 'idle',
          message: '',
          products: [],
        });
      });
    });

    const activeFirstId = firstLevel[0].id;
    this.setData({ firstLevel, groups, activeFirstId, state: 'ready' });
    setTimeout(() => this.measureGroupOffsets(), 0);
    this.loadPrimary(activeFirstId);
  },

  async loadGroup(categoryId: number, force = false): Promise<void> {
    const index = this.data.groups.findIndex((group) => group.categoryId === categoryId);
    if (index < 0) {
      return;
    }
    if (!force && ['loading', 'success', 'empty', 'error'].includes(this.data.groups[index].state)) {
      return;
    }

    const cached = this.productCache[categoryId];
    if (cached) {
      this.setGroupPatch(index, {
        state: cached.length > 0 ? 'success' : 'empty',
        message: '',
        products: cached,
      });
      return;
    }

    let guard = this.groupGuards[categoryId];
    if (!guard) {
      guard = createLatestRequestGuard();
      this.groupGuards[categoryId] = guard;
    }
    const token = guard.begin();
    this.setGroupPatch(index, { state: 'loading', message: '', products: [] });

    const result = await catalogApi.getCategoryProducts(categoryId);
    if (!guard.isLatest(token)) {
      return;
    }

    if (result.kind === 'success' || result.kind === 'empty') {
      const products = result.kind === 'success' ? toProductRows(result.data, getApiBaseUrl()) : [];
      this.productCache[categoryId] = products;
      this.setGroupPatch(index, {
        state: products.length > 0 ? 'success' : 'empty',
        message: '',
        products,
      });
    } else {
      this.setGroupPatch(index, {
        state: 'error',
        message: result.kind === 'failure' ? result.message : '分类不存在或已下架',
        products: [],
      });
    }
    setTimeout(() => this.measureGroupOffsets(), 0);
  },

  onFirstSelect(event: { currentTarget: { dataset: { id: number } } }): void {
    const id = Number(event.currentTarget.dataset.id);
    const groupIndex = this.data.groups.findIndex((group) => group.parentId === id);
    this.ignoreScrollUntil = Date.now() + PROGRAMMATIC_SCROLL_WINDOW;
    this.setData({ activeFirstId: id, activeGroupAnchor: '' });

    setTimeout(() => {
      if (groupIndex >= 0) {
        this.setData({ activeGroupAnchor: this.data.groups[groupIndex].id });
      }
      this.measureGroupOffsets();
    }, 0);

    this.loadPrimary(id);
  },

  onListScroll(event: { detail: { scrollTop: number } }): void {
    const scrollTop = event.detail.scrollTop;
    this.listScrollTop = scrollTop;
    if (Date.now() < this.ignoreScrollUntil) {
      return;
    }
    if (this.scrollTimer !== undefined) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      this.scrollTimer = undefined;
      this.updateActiveByScroll(scrollTop);
    }, REVERSE_HIGHLIGHT_DELAY);
  },

  updateActiveByScroll(scrollTop: number): void {
    if (this.groupOffsets.length === 0) {
      return;
    }
    let index = 0;
    for (let i = 0; i < this.groupOffsets.length; i += 1) {
      if (this.groupOffsets[i] <= scrollTop + 8) {
        index = i;
      } else {
        break;
      }
    }
    const group = this.data.groups[index];
    if (!group || group.parentId === this.data.activeFirstId) {
      return;
    }
    this.setData({ activeFirstId: group.parentId });
    this.loadPrimary(group.parentId);
  },

  onRetryGroup(event: { currentTarget: { dataset: { id: number } } }): void {
    const id = Number(event.currentTarget.dataset.id);
    void this.loadGroup(id, true);
  },

  onRetry(): void {
    void this.loadTree();
  },

  onSearchTap(): void {
    setSearchKeyword('');
    wx.navigateTo({ url: '/pages/search/search' });
  },

  onProductSelect(event: { detail: { id: number } }): void {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.detail.id}` });
  },
});
