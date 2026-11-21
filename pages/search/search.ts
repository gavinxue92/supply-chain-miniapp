import { catalogApi, SEARCH_LOAD_FAILED_MESSAGE } from '../../api/catalog';
import { getApiBaseUrl } from '../../config/environment';
import { getAppGlobalData, setSearchKeyword } from '../../utils/app-state';
import { toProductCards, type ProductCardData } from '../../utils/product';
import { createLatestRequestGuard } from '../../utils/race';
import { debounce, normalizeSearchKeyword, SEARCH_DEBOUNCE_MS, type DebouncedAction } from '../../utils/search';

type SearchState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

const HISTORY_STORAGE_KEY = 'miniapp_search_history';
const HISTORY_LIMIT = 10;

interface SearchData {
  keyword: string;
  submittedKeyword: string;
  state: SearchState;
  products: ProductCardData[];
  errorMessage: string;
  history: string[];
}

Page({
  requestGuard: createLatestRequestGuard(),
  debouncedSearch: undefined as DebouncedAction<string> | undefined,

  data: {
    keyword: '',
    submittedKeyword: '',
    state: 'idle',
    products: [],
    errorMessage: '',
    history: [],
  } as SearchData,

  onLoad(options: Record<string, string | undefined>) {
    this.debouncedSearch = debounce<string>((value) => {
      void this.runSearch(value);
    }, SEARCH_DEBOUNCE_MS);

    let history: string[] = [];
    try {
      const stored = wx.getStorageSync(HISTORY_STORAGE_KEY);
      if (Array.isArray(stored)) {
        history = stored.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      history = [];
    }
    this.setData({ history });

    const keyword = options.keyword ?? getAppGlobalData().searchKeyword ?? '';
    this.setData({ keyword });
    if (normalizeSearchKeyword(keyword)) {
      void this.runSearch(keyword);
    }
  },

  onShow() {
    const incoming = normalizeSearchKeyword(getAppGlobalData().searchKeyword);
    if (incoming && incoming !== this.data.submittedKeyword) {
      this.setData({ keyword: incoming });
      void this.runSearch(incoming);
    }
  },

  onHide() {
    this.debouncedSearch?.cancel();
  },

  onUnload() {
    this.debouncedSearch?.cancel();
  },

  async runSearch(rawKeyword: string): Promise<void> {
    const keyword = normalizeSearchKeyword(rawKeyword);
    if (!keyword) {
      this.setData({ submittedKeyword: '', products: [], state: 'empty', errorMessage: '' });
      return;
    }

    const token = this.requestGuard.begin();
    this.setData({ keyword, submittedKeyword: keyword, state: 'loading', products: [], errorMessage: '' });
    setSearchKeyword(keyword);

    const result = await catalogApi.searchProducts(keyword);
    if (!this.requestGuard.isLatest(token)) {
      return;
    }
    this.saveHistory(keyword);

    if (result.kind === 'success') {
      this.setData({ products: toProductCards(result.data, getApiBaseUrl()), state: 'ready' });
      return;
    }
    if (result.kind === 'empty') {
      this.setData({ products: [], state: 'empty' });
      return;
    }
    this.setData({
      products: [],
      state: 'error',
      errorMessage: result.kind === 'failure' ? result.message : SEARCH_LOAD_FAILED_MESSAGE,
    });
  },

  onKeywordInput(event: { detail: { value: string } }): void {
    this.setData({ keyword: event.detail.value });
    this.debouncedSearch?.(event.detail.value);
  },

  onSearchSubmit(event: { detail: { keyword: string } }): void {
    this.debouncedSearch?.cancel();
    void this.runSearch(event.detail.keyword);
  },

  onClear(): void {
    this.debouncedSearch?.cancel();
    setSearchKeyword('');
    this.setData({ keyword: '', submittedKeyword: '', products: [], state: 'idle', errorMessage: '' });
  },

  saveHistory(keyword: string): void {
    const history = [keyword, ...this.data.history.filter((item) => item !== keyword)].slice(0, HISTORY_LIMIT);
    this.setData({ history });
    try {
      wx.setStorageSync(HISTORY_STORAGE_KEY, history);
    } catch {
      wx.showToast({ title: '搜索历史保存失败', icon: 'none' });
    }
  },

  onHistorySelect(event: { currentTarget: { dataset: { value: string } } }): void {
    this.debouncedSearch?.cancel();
    void this.runSearch(event.currentTarget.dataset.value);
  },

  onClearHistory(): void {
    wx.showModal({
      title: '清除搜索历史',
      content: '确定要清除全部搜索历史吗？',
      success: (result) => {
        if (!result.confirm) {
          return;
        }
        this.setData({ history: [] });
        try {
          wx.removeStorageSync(HISTORY_STORAGE_KEY);
        } catch {
          wx.showToast({ title: '搜索历史清除失败', icon: 'none' });
        }
        wx.showToast({ title: '搜索历史已清除', icon: 'none' });
      },
    });
  },

  onUnavailable(): void {
    wx.showToast({ title: '暂未开放', icon: 'none' });
  },

  onRetry(): void {
    void this.runSearch(this.data.submittedKeyword);
  },

  onBackHome(): void {
    this.debouncedSearch?.cancel();
    wx.switchTab({ url: '/pages/index/index' });
  },

  onProductSelect(event: { detail: { id: number } }): void {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.detail.id}` });
  },
});
